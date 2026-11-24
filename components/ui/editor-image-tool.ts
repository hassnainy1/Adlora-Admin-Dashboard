import type { BlockAPI, BlockTool, BlockToolConstructorOptions } from "@editorjs/editorjs";

/** Data an image block saves — also what `imageBlockToHtml` serializes. */
export interface EditorImageData {
  url: string;
  alt: string;
  caption: string;
}

export interface EditorImageConfig {
  /** Uploads the picked file and resolves to its public URL. */
  upload: (file: File) => Promise<string>;
}

const ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>`;

const INPUT_CLASS =
  "w-full rounded-md border border-(--border) bg-(--surface) px-2.5 py-1.5 text-xs text-(--text) outline-none focus:border-(--accent)";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** `editorjs-html` parser for this block: `<figure><img alt><figcaption>`. */
export function imageBlockToHtml({ data }: { data: EditorImageData }): string {
  const caption = data.caption.trim() ? `<figcaption>${escapeHtml(data.caption.trim())}</figcaption>` : "";
  return `<figure><img src="${escapeHtml(data.url)}" alt="${escapeHtml(data.alt.trim())}" />${caption}</figure>`;
}

/** Reverse of `imageBlockToHtml`, for loading stored HTML back into the editor. */
export function htmlToImageData(el: Element): EditorImageData | null {
  const img = el.tagName.toLowerCase() === "img" ? el : el.querySelector("img");
  const url = img?.getAttribute("src");
  if (!url) return null;
  return {
    url,
    alt: img?.getAttribute("alt") ?? "",
    caption: el.querySelector("figcaption")?.textContent ?? "",
  };
}

/**
 * Editor.js block tool for images placed between paragraphs. Upload, alt
 * text and caption all live in the block; empty (never-uploaded) blocks are
 * dropped on save via `validate`.
 */
export class EditorImageTool implements BlockTool {
  static get toolbox() {
    return { title: "Image", icon: ICON };
  }

  static get isReadOnlySupported() {
    return true;
  }

  private data: EditorImageData;
  private readonly config: EditorImageConfig;
  private readonly readOnly: boolean;
  private readonly block: BlockAPI;
  private wrapper: HTMLDivElement | null = null;

  constructor({ data, config, readOnly, block }: BlockToolConstructorOptions<EditorImageData, EditorImageConfig>) {
    this.data = { url: data?.url ?? "", alt: data?.alt ?? "", caption: data?.caption ?? "" };
    this.config = config as EditorImageConfig;
    this.readOnly = readOnly;
    this.block = block;
  }

  render(): HTMLElement {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "my-2 space-y-2";
    if (this.data.url) this.renderImage();
    else this.renderPicker();
    return this.wrapper;
  }

  save(): EditorImageData {
    return { ...this.data };
  }

  validate(data: EditorImageData): boolean {
    return Boolean(data.url);
  }

  private renderPicker(error?: string) {
    const wrapper = this.wrapper!;
    wrapper.replaceChildren();

    const label = document.createElement("label");
    label.className =
      "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-(--border) px-4 py-6 text-xs text-(--text-muted) hover:bg-(--surface-2)";
    label.innerHTML = `${ICON}<span>Click to upload an image</span>`;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.className = "sr-only";
    input.disabled = this.readOnly;
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (file) void this.upload(file);
    });
    label.appendChild(input);
    wrapper.appendChild(label);

    if (error) {
      const message = document.createElement("p");
      message.setAttribute("role", "alert");
      message.className = "text-xs text-(--danger)";
      message.textContent = error;
      wrapper.appendChild(message);
    }
  }

  private async upload(file: File) {
    const wrapper = this.wrapper!;
    wrapper.replaceChildren();
    const status = document.createElement("p");
    status.className = "rounded-md border border-(--border) px-4 py-6 text-center text-xs text-(--text-muted)";
    status.textContent = "Uploading…";
    wrapper.appendChild(status);

    try {
      const url = await this.config.upload(file);
      this.data = { ...this.data, url };
      this.renderImage();
      this.block.dispatchChange();
    } catch (err) {
      this.renderPicker(err instanceof Error ? err.message : "Image upload failed.");
    }
  }

  private renderImage() {
    const wrapper = this.wrapper!;
    wrapper.replaceChildren();

    const img = document.createElement("img");
    img.src = this.data.url;
    img.alt = this.data.alt;
    img.className = "max-h-80 w-full rounded-md border border-(--border) object-contain";
    wrapper.appendChild(img);

    wrapper.appendChild(
      this.textInput("alt", "Alt text — describe the image for SEO & screen readers", (value) => {
        img.alt = value;
      }),
    );
    wrapper.appendChild(this.textInput("caption", "Caption (optional)"));
  }

  private textInput(field: "alt" | "caption", placeholder: string, onInput?: (value: string) => void) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = this.data[field];
    input.placeholder = placeholder;
    input.setAttribute("aria-label", placeholder);
    input.className = INPUT_CLASS;
    input.disabled = this.readOnly;
    input.addEventListener("input", () => {
      this.data = { ...this.data, [field]: input.value };
      onInput?.(input.value);
      // Typing into an <input> doesn't mutate the DOM, so Editor.js wouldn't
      // otherwise notice the change and fire onChange.
      this.block.dispatchChange();
    });
    // Keep Enter/Backspace from being treated as block navigation.
    input.addEventListener("keydown", (e) => e.stopPropagation());
    return input;
  }
}
