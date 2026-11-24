"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftIcon, BlogIcon } from "@/components/icons";
import { ApiError } from "@/lib/api";
import { blogApi, validateBlogFields, type Blog, type BlogPayload } from "@/lib/blog";
import { invalidate } from "@/lib/data-refresh";
import {
  BlogFormFields,
  EMPTY_BLOG_FORM,
  blogToFormState,
  type BlogFormState,
} from "@/components/blog/blog-shared";

const TRIMMED_TEXT_FIELDS = ["title", "description", "metaTitle", "metaDescription", "imageAlt", "schema"] as const;

/** Only fields that differ from the loaded post are sent in the PATCH. */
function changedFields(initial: BlogFormState, state: BlogFormState): BlogPayload {
  const payload: BlogPayload = {};
  for (const key of TRIMMED_TEXT_FIELDS) {
    const value = state[key].trim();
    if (value !== initial[key].trim()) payload[key] = value;
  }
  if (state.slug !== initial.slug) payload.slug = state.slug;
  if (state.contentHtml !== initial.contentHtml) payload.contentHtml = state.contentHtml;
  if (state.image) payload.image = state.image;
  return payload;
}

export function BlogEdit({ id }: { id: string }) {
  const router = useRouter();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [initial, setInitial] = useState<BlogFormState>(EMPTY_BLOG_FORM);
  const [state, setState] = useState<BlogFormState>(EMPTY_BLOG_FORM);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "notfound" | "error">("loading");
  const [loadErrorMsg, setLoadErrorMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const data = await blogApi.get(id);
      setBlog(data);
      const formState = blogToFormState(data);
      setInitial(formState);
      setState(formState);
      setLoadState("loaded");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setLoadState("notfound");
      } else {
        setLoadErrorMsg(err instanceof ApiError ? err.message : "Failed to load blog post.");
        setLoadState("error");
      }
    }
  }, [id]);

  useEffect(() => {
    // setState runs only after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function update(next: Partial<BlogFormState>) {
    setState((prev) => ({ ...prev, ...next }));
  }

  const slugChanged = state.slug !== initial.slug;

  async function submit() {
    const validationError = validateBlogFields(state);
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await blogApi.update(id, changedFields(initial, state));
      setBlog(updated);
      const formState = blogToFormState(updated);
      setInitial(formState);
      setState(formState);
      invalidate("blog");
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && /already exists/i.test(err.message)) {
        setError(`${err.message}. Choose a different title or slug.`);
      } else {
        setError(err instanceof ApiError ? err.message : "Failed to update blog post.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    setDeleteBusy(true);
    try {
      await blogApi.remove(id);
      invalidate("blog");
      router.push("/blog");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete blog post.");
      setDeleteBusy(false);
      setDeleting(false);
    }
  }

  if (loadState === "loading") {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-7 w-48 rounded" />
        <Card className="space-y-4 p-5">
          <Skeleton className="h-24 w-24 rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-40 w-full rounded-md" />
        </Card>
      </div>
    );
  }

  if (loadState === "notfound") {
    return (
      <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 lg:p-8">
        <EmptyState icon={BlogIcon} title="Blog post not found" description="It may have been deleted." />
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)">
          <span>{loadErrorMsg}</span>
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!blog) return null;

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
        <h1 className="text-xl font-semibold tracking-tight text-(--text)">Edit Blog Post</h1>
        <Link href={`/blog/${id}/view`} className="ml-auto">
          <Button variant="secondary" size="sm">
            View
          </Button>
        </Link>
      </div>

      <Card className="space-y-4 p-5">
        <BlogFormFields state={state} onChange={update} blog={blog} disabled={busy} />
        {slugChanged && (
          <p className="rounded-md border border-(--border) bg-(--surface-2) px-3 py-2 text-xs text-(--text-muted)">
            Saving will change this post&apos;s URL from <code>/{blog.slug}</code> to <code>/{state.slug}</code> —
            existing links to the old URL will stop working.
          </p>
        )}
      </Card>

      {error && (
        <p role="alert" className="rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-2 text-sm text-(--danger)">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button variant="danger" onClick={() => setDeleting(true)} disabled={busy}>
          Delete
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push("/blog")} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={busy}>
            {busy ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      <Modal open={deleting} onClose={() => setDeleting(false)} title="Delete blog post">
        <div className="space-y-4">
          <p className="text-sm text-(--text-secondary)">
            This will permanently delete the blog and its cover image. Continue?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleting(false)} disabled={deleteBusy}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" disabled={deleteBusy} onClick={() => void confirmDelete()}>
              {deleteBusy ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
