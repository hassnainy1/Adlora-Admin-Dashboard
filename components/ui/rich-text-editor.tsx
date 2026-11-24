"use client";

import { useEffect, useRef } from "react";
import EditorJS, { type OutputData } from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import edjsHTML from "editorjs-html";
import { cn } from "@/lib/cn";
import {
  EditorImageTool,
  htmlToImageData,
  imageBlockToHtml,
  type EditorImageConfig,
} from "@/components/ui/editor-image-tool";

const htmlParser = edjsHTML({ image: imageBlockToHtml });

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;

function headingIcon(level: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><text x="12" y="16.5" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="currentColor">H${level}</text></svg>`;
}

/** One toolbox entry per heading level, so H1–H6 are picked directly from the "+" menu. */
const headerTool = {
  class: Header,
  inlineToolbar: true,
  config: { levels: [...HEADING_LEVELS], defaultLevel: 2 },
  toolbox: HEADING_LEVELS.map((level) => ({
    title: `Heading ${level}`,
    icon: headingIcon(level),
    data: { level },
  })),
};

/**
 * Callers store this editor's output as a plain HTML string, but Editor.js
 * works in blocks — so existing HTML (whether written by hand or exported by
 * `edjsHTML` below) gets split back into blocks on the way in.
 */
function htmlToBlocks(html: string): OutputData["blocks"] {
  const trimmed = html.trim();
  if (!trimmed) return [{ type: "paragraph", data: { text: "" } }];

  const doc = new DOMParser().parseFromString(trimmed, "text/html");
  const blocks: OutputData["blocks"] = [];
  for (const el of Array.from(doc.body.children)) {
    const tag = el.tagName.toLowerCase();
    const headingMatch = /^h([1-6])$/.exec(tag);
    const imageData = tag === "figure" || tag === "img" ? htmlToImageData(el) : null;
    if (headingMatch) {
      blocks.push({ type: "header", data: { text: el.innerHTML, level: Number(headingMatch[1]) } });
    } else if (imageData) {
      blocks.push({ type: "image", data: imageData });
    } else if (tag === "ul" || tag === "ol") {
      const items = Array.from(el.children).map((li) => ({ content: li.innerHTML, items: [] }));
      blocks.push({ type: "list", data: { style: tag === "ul" ? "unordered" : "ordered", items } });
    } else {
      blocks.push({ type: "paragraph", data: { text: el.innerHTML } });
    }
  }
  return blocks.length ? blocks : [{ type: "paragraph", data: { text: doc.body.innerHTML } }];
}

/** Shared Editor.js-based rich text editor — used by Blog and Pages content fields. */
export function RichTextEditor({
  value,
  onChange,
  disabled,
  onUploadImage,
}: {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  /** Enables the inline "Image" block; resolves to the uploaded image's public URL. */
  onUploadImage?: (file: File) => Promise<string>;
}) {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<EditorJS | null>(null);
  const lastEmitted = useRef(value);
  // Serializes init/destroy so React Strict Mode's mount→cleanup→remount
  // in dev can't run two EditorJS instances on the same holder at once —
  // overlapping instances raced here and left the holder empty.
  const chainRef = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;

    // Editor.js only selects the whole document on a *second* Ctrl/Cmd+A
    // (the first selects just the active block, which reads as "broken"
    // multi-paragraph selection) — so select every block's text directly
    // with the native Range API on the first press instead.
    function selectAll(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "a") return;
      // Plain inputs inside a block (image alt/caption) keep native select-all.
      if (e.target instanceof HTMLInputElement) return;
      const redactor = holder!.querySelector(".codex-editor__redactor") ?? holder!;
      e.preventDefault();
      e.stopPropagation();
      const range = document.createRange();
      range.selectNodeContents(redactor);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    holder.addEventListener("keydown", selectAll, true);

    chainRef.current = chainRef.current.then(() => {
      const editor = new EditorJS({
        holder,
        minHeight: 160,
        placeholder: "Write the content…",
        readOnly: disabled,
        tools: {
          header: headerTool,
          list: { class: List, inlineToolbar: true },
          ...(onUploadImage && {
            image: {
              class: EditorImageTool,
              config: { upload: onUploadImage } satisfies EditorImageConfig,
            },
          }),
        },
        data: { blocks: htmlToBlocks(lastEmitted.current) },
        onChange: async () => {
          const output = await editor.save();
          const html = htmlParser.parse(output);
          lastEmitted.current = html;
          onChange(html);
        },
      });
      editorRef.current = editor;
      return editor.isReady.catch(() => {});
    });

    return () => {
      holder.removeEventListener("keydown", selectAll, true);
      chainRef.current = chainRef.current.then(() => {
        const editor = editorRef.current;
        editorRef.current = null;
        return editor?.destroy();
      });
    };
    // Editor instance is created once per mount; external `value` updates are
    // applied via editor.render() in the effect below instead of recreating it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-renders the editor when `value` changes from outside (e.g. the async
  // load that prefills existing content) — skipped when it matches what this
  // editor itself just emitted, to avoid clobbering the caret mid-edit.
  useEffect(() => {
    if (value === lastEmitted.current) return;
    lastEmitted.current = value;
    chainRef.current = chainRef.current.then(async () => {
      const editor = editorRef.current;
      if (!editor) return;
      await editor.isReady.catch(() => {});
      await editor.render({ blocks: htmlToBlocks(value) }).catch(() => {});
    });
  }, [value]);

  useEffect(() => {
    chainRef.current = chainRef.current.then(async () => {
      const editor = editorRef.current;
      if (!editor) return;
      await editor.isReady.catch(() => {});
      editor.readOnly.toggle(disabled ?? false).catch(() => {});
    });
  }, [disabled]);

  return (
    <div
      className={cn(
        "rounded-md border border-(--border) bg-(--surface) px-3 py-2.5",
        disabled && "opacity-60",
      )}
    >
      <div
        ref={holderRef}
        className={cn(
          "prose-editor text-sm text-(--text)",
          "[&_.ce-paragraph]:leading-relaxed",
          "[&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-semibold",
          "[&_h4]:text-sm [&_h4]:font-semibold [&_h5]:text-sm [&_h5]:font-medium [&_h6]:text-xs [&_h6]:font-medium [&_h6]:uppercase",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_a]:text-(--accent) [&_a]:underline",
          // Editor.js hardcodes the add-block "+" and drag/settings-handle
          // icons to a dark navy colour with no background — invisible
          // against this app's dark theme without an explicit override.
          "[&_.ce-toolbar__plus]:text-(--text-muted) [&_.ce-toolbar__settings-btn]:text-(--text-muted)",
          "[&_.ce-toolbar__plus:hover]:bg-(--surface-2) [&_.ce-toolbar__settings-btn:hover]:bg-(--surface-2)",
          // Its popovers (block-type menu, inline bold/italic/link toolbar)
          // are styled via these CSS custom properties, hardcoded to a white
          // background + black text — re-themed to match dark mode too.
          "[&_.ce-popover]:[--color-background:var(--surface)] [&_.ce-popover]:[--color-border:var(--border)]",
          "[&_.ce-popover]:[--color-text-primary:var(--text)] [&_.ce-popover]:[--color-text-secondary:var(--text-muted)]",
          "[&_.ce-popover]:[--color-background-item-hover:var(--surface-2)]",
          "[&_.ce-inline-toolbar]:[--color-background:var(--surface)] [&_.ce-inline-toolbar]:[--color-border:var(--border)]",
          "[&_.ce-inline-toolbar]:[--color-text-primary:var(--text)]",
          // Regular text-selection contrast (`::selection`) is handled
          // globally in globals.css via `.prose-editor ::selection`, which
          // this holder carries. Dragging a selection across multiple
          // blocks uses a separate mechanism though — Editor.js hardcodes a
          // light-blue (#e1f2ff) solid `background` on the block content,
          // which is unreadable against the (light) --text colour it keeps
          // on top — so re-themed to the same accent/accent-foreground pair
          // as the global selection rule.
          "[&_.ce-block--selected_.ce-block__content]:[background:var(--accent)] [&_.ce-block--selected_.ce-block__content]:[color:var(--accent-foreground)]",
        )}
      />
    </div>
  );
}
