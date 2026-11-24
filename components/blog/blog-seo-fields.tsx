"use client";

import { useId, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { BLOG_LIMITS, buildBlogSchema, slugify } from "@/lib/blog";
import type { BlogFormState } from "@/components/blog/blog-shared";

const INPUT_CLASS =
  "w-full rounded-md border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text) outline-none transition-colors focus:border-(--accent)";

/** Label + control + hint row, with an optional live character counter. */
export function FormField({
  label,
  hint,
  count,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  count?: { value: number; recommended?: number; max: number };
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  const overRecommended = count?.recommended !== undefined && count.value > count.recommended;
  const overMax = count !== undefined && count.value > count.max;

  return (
    <div className="space-y-1 text-sm">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="font-medium text-(--text)">
          {label}
        </label>
        {count && (
          <span
            className={cn(
              "text-xs tabular-nums",
              overMax ? "text-(--danger)" : overRecommended ? "text-(--warning)" : "text-(--text-subtle)",
            )}
          >
            {count.value}/{count.recommended ?? count.max}
          </span>
        )}
      </div>
      {children(id)}
      {hint && <p className="text-xs text-(--text-subtle)">{hint}</p>}
    </div>
  );
}

/** Slug, meta title/description and JSON-LD schema for a blog post. */
export function BlogSeoFields({
  state,
  onSlugChange,
  onChange,
  coverImageUrl,
  dates,
  disabled,
}: {
  state: BlogFormState;
  /** Raw slug input — the parent decides whether it re-links to the title. */
  onSlugChange: (raw: string) => void;
  onChange: (next: Partial<BlogFormState>) => void;
  coverImageUrl: string | null;
  dates?: { createdAt: string; updatedAt: string };
  disabled?: boolean;
}) {
  function generateSchema() {
    onChange({
      schema: buildBlogSchema({
        title: state.title,
        metaTitle: state.metaTitle,
        description: state.description,
        metaDescription: state.metaDescription,
        imageUrl: coverImageUrl,
        datePublished: dates?.createdAt,
        dateModified: dates?.updatedAt,
      }),
    });
  }

  return (
    <fieldset className="space-y-4 border-t border-(--border-subtle) pt-4">
      <legend className="sr-only">SEO</legend>
      <h2 className="text-sm font-semibold text-(--text)">SEO</h2>

      <FormField
        label="Slug"
        hint={
          state.slugLinked
            ? "Generated from the title. Edit it to set a custom URL."
            : "Custom slug. Clear the field to generate it from the title again."
        }
      >
        {(id) => (
          <div className="flex items-center rounded-md border border-(--border) bg-(--surface) focus-within:border-(--accent)">
            <span className="pl-3 text-sm text-(--text-subtle)">/blog/</span>
            <input
              id={id}
              type="text"
              value={state.slug}
              disabled={disabled}
              onChange={(e) => onSlugChange(e.target.value)}
              onBlur={() => {
                // Drop stray leading/trailing hyphens left over from typing.
                const clean = slugify(state.slug);
                if (clean !== state.slug) onSlugChange(clean);
              }}
              className="w-full bg-transparent py-2 pr-3 font-mono text-sm text-(--text) outline-none"
            />
          </div>
        )}
      </FormField>

      <FormField
        label="Meta title"
        hint="Shown in search results and browser tabs. Falls back to the title when empty."
        count={{
          value: state.metaTitle.trim().length,
          recommended: BLOG_LIMITS.metaTitleRecommended,
          max: BLOG_LIMITS.metaTitle,
        }}
      >
        {(id) => (
          <input
            id={id}
            type="text"
            value={state.metaTitle}
            disabled={disabled}
            placeholder={state.title}
            maxLength={BLOG_LIMITS.metaTitle}
            onChange={(e) => onChange({ metaTitle: e.target.value })}
            className={INPUT_CLASS}
          />
        )}
      </FormField>

      <FormField
        label="Meta description"
        hint="Shown under the title in search results. Falls back to the description when empty."
        count={{
          value: state.metaDescription.trim().length,
          recommended: BLOG_LIMITS.metaDescriptionRecommended,
          max: BLOG_LIMITS.metaDescription,
        }}
      >
        {(id) => (
          <textarea
            id={id}
            value={state.metaDescription}
            disabled={disabled}
            placeholder={state.description}
            maxLength={BLOG_LIMITS.metaDescription}
            rows={3}
            onChange={(e) => onChange({ metaDescription: e.target.value })}
            className={cn(INPUT_CLASS, "resize-none")}
          />
        )}
      </FormField>

      <FormField
        label="Schema (JSON-LD)"
        hint={
          <>
            Structured data rendered as <code>{'<script type="application/ld+json">'}</code> on the post page.
            Optional.
          </>
        }
      >
        {(id) => (
          <div className="space-y-2">
            <textarea
              id={id}
              value={state.schema}
              disabled={disabled}
              rows={8}
              spellCheck={false}
              placeholder='{ "@context": "https://schema.org", "@type": "BlogPosting", … }'
              onChange={(e) => onChange({ schema: e.target.value })}
              className={cn(INPUT_CLASS, "font-mono text-xs")}
            />
            <Button variant="secondary" size="sm" onClick={generateSchema} disabled={disabled}>
              {state.schema.trim() ? "Regenerate from post" : "Generate from post"}
            </Button>
          </div>
        )}
      </FormField>
    </fieldset>
  );
}
