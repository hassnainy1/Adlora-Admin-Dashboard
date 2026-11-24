"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeftIcon } from "@/components/icons";
import { ApiError } from "@/lib/api";
import { blogApi, validateBlogFields } from "@/lib/blog";
import { invalidate } from "@/lib/data-refresh";
import { BlogFormFields, EMPTY_BLOG_FORM, type BlogFormState } from "@/components/blog/blog-shared";

export function BlogCreate() {
  const router = useRouter();
  const [state, setState] = useState<BlogFormState>(EMPTY_BLOG_FORM);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update(next: Partial<BlogFormState>) {
    setState((prev) => ({ ...prev, ...next }));
  }

  async function submit() {
    const validationError = validateBlogFields(state);
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const blog = await blogApi.create({
        title: state.title.trim(),
        slug: state.slug,
        description: state.description.trim() || undefined,
        metaTitle: state.metaTitle.trim() || undefined,
        metaDescription: state.metaDescription.trim() || undefined,
        imageAlt: state.imageAlt.trim() || undefined,
        schema: state.schema.trim() || undefined,
        contentHtml: state.contentHtml,
        image: state.image ?? undefined,
      });
      invalidate("blog");
      router.push(`/blog/${blog.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && /already exists/i.test(err.message)) {
        setError(`${err.message}. Choose a different title or slug.`);
      } else {
        setError(err instanceof ApiError ? err.message : "Failed to create blog post.");
      }
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <Link
          href="/blog"
          className="flex h-8 w-8 items-center justify-center rounded-md text-(--text-muted) transition-colors hover:bg-(--surface-2) hover:text-(--text)"
          aria-label="Back to blog list"
        >
          <ArrowLeftIcon width={16} height={16} />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-(--text)">New Blog Post</h1>
      </div>

      <Card className="p-5">
        <BlogFormFields state={state} onChange={update} disabled={busy} />
      </Card>

      {error && (
        <p role="alert" className="rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-2 text-sm text-(--danger)">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => router.push("/blog")} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={() => void submit()} disabled={busy}>
          {busy ? "Creating…" : "Create Blog"}
        </Button>
      </div>
    </div>
  );
}
