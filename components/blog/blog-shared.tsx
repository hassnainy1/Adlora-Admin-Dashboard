"use client";

import { useEffect, useState } from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { BlogSeoFields, FormField } from "@/components/blog/blog-seo-fields";
import { mediaUrl } from "@/lib/api";
import { BLOG_LIMITS, blogApi, normalizeSlugInput, slugify, type Blog } from "@/lib/blog";

export interface BlogFormState {
  title: string;
  slug: string;
  /** True while the slug auto-follows the title (until the user edits it). */
  slugLinked: boolean;
  description: string;
  metaTitle: string;
  metaDescription: string;
  imageAlt: string;
  schema: string;
  contentHtml: string;
  image: File | null;
}

export const EMPTY_BLOG_FORM: BlogFormState = {
  title: "",
  slug: "",
  slugLinked: true,
  description: "",
  metaTitle: "",
  metaDescription: "",
  imageAlt: "",
  schema: "",
  contentHtml: "",
  image: null,
};

export function blogToFormState(blog: Blog): BlogFormState {
  return {
    title: blog.title,
    slug: blog.slug,
    // An existing slug that still matches its title keeps following it.
    slugLinked: blog.slug === slugify(blog.title),
    description: blog.description ?? "",
    metaTitle: blog.metaTitle ?? "",
    metaDescription: blog.metaDescription ?? "",
    imageAlt: blog.imageAlt ?? "",
    schema: blog.schema ?? "",
    contentHtml: blog.contentHtml,
    image: null,
  };
}

/** Title edits regenerate the slug only while it's still linked. */
function titleChange(state: BlogFormState, title: string): Partial<BlogFormState> {
  return state.slugLinked ? { title, slug: slugify(title) } : { title };
}

/** Typing a slug unlinks it; clearing it re-links it to the title. */
function slugChange(state: BlogFormState, raw: string): Partial<BlogFormState> {
  const slug = normalizeSlugInput(raw);
  if (!slug) return { slug: slugify(state.title), slugLinked: true };
  return { slug, slugLinked: false };
}

async function uploadContentImage(file: File): Promise<string> {
  const { url } = await blogApi.uploadContentImage(file);
  return mediaUrl(url) ?? url;
}

const INPUT_CLASS =
  "w-full rounded-md border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text) outline-none transition-colors focus:border-(--accent)";

/** Fields shared between the create and edit blog pages. */
export function BlogFormFields({
  state,
  onChange,
  blog,
  disabled,
}: {
  state: BlogFormState;
  onChange: (next: Partial<BlogFormState>) => void;
  /** Existing post (edit mode only) — supplies the current cover and dates. */
  blog?: Blog | null;
  disabled?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const currentImageUrl = mediaUrl(blog?.image);

  useEffect(() => {
    if (!state.image) {
      // Tied to the File's object-URL lifecycle, not derivable from other state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(state.image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [state.image]);

  const hasCover = Boolean(preview || currentImageUrl);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <span className="block text-sm font-medium text-(--text)">Cover image</span>
        <div className="flex items-center gap-4">
          {hasCover ? (
            <img
              src={preview ?? currentImageUrl ?? undefined}
              alt={state.imageAlt || "Cover preview"}
              className="h-24 w-24 rounded-md border border-(--border) object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed border-(--border) text-xs text-(--text-subtle)">
              No image
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            aria-label="Cover image"
            disabled={disabled}
            onChange={(e) => onChange({ image: e.target.files?.[0] ?? null })}
            className="text-sm text-(--text-secondary) file:mr-3 file:rounded-md file:border-0 file:bg-(--surface-2) file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-(--text)"
          />
        </div>
        <FormField
          label="Image alt text"
          hint="Describes the cover image for search engines and screen readers."
          count={{ value: state.imageAlt.trim().length, max: BLOG_LIMITS.imageAlt }}
        >
          {(id) => (
            <input
              id={id}
              type="text"
              value={state.imageAlt}
              disabled={disabled}
              maxLength={BLOG_LIMITS.imageAlt}
              placeholder="e.g. Fine-line rose tattoo on a forearm"
              onChange={(e) => onChange({ imageAlt: e.target.value })}
              className={INPUT_CLASS}
            />
          )}
        </FormField>
      </div>

      <FormField
        label={
          <>
            Title <span className="text-(--danger)">*</span>
          </>
        }
      >
        {(id) => (
          <input
            id={id}
            type="text"
            value={state.title}
            disabled={disabled}
            onChange={(e) => onChange(titleChange(state, e.target.value))}
            className={INPUT_CLASS}
          />
        )}
      </FormField>

      <FormField label="Description">
        {(id) => (
          <textarea
            id={id}
            value={state.description}
            disabled={disabled}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={2}
            placeholder="Short excerpt shown in blog listings…"
            className={`${INPUT_CLASS} resize-none`}
          />
        )}
      </FormField>

      <div className="space-y-1 text-sm">
        <span className="block font-medium text-(--text)">
          Content <span className="text-(--danger)">*</span>
        </span>
        <RichTextEditor
          value={state.contentHtml}
          onChange={(html) => onChange({ contentHtml: html })}
          onUploadImage={uploadContentImage}
          disabled={disabled}
        />
      </div>

      <BlogSeoFields
        state={state}
        onChange={onChange}
        onSlugChange={(raw) => onChange(slugChange(state, raw))}
        coverImageUrl={currentImageUrl}
        dates={blog ? { createdAt: blog.createdAt, updatedAt: blog.updatedAt } : undefined}
        disabled={disabled}
      />
    </div>
  );
}
