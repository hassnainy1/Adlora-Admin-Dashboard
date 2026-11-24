"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { useToasts, ToastViewport } from "@/components/ui/toast";
import { BlogIcon, SearchIcon, TrashIcon } from "@/components/icons";
import { ApiError, mediaUrl } from "@/lib/api";
import type { Pagination } from "@/lib/api";
import { blogApi, type Blog } from "@/lib/blog";
import { useRefreshOn, invalidate } from "@/lib/data-refresh";

const LIMIT = 20;

export function BlogsManager() {
  const router = useRouter();
  const [items, setItems] = useState<Blog[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<Blog | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const { toasts, notify, dismiss } = useToasts();

  // Debounce the search box into the actual filter used for fetching.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  const filters = useMemo(
    () => ({ page, limit: LIMIT, search: search || undefined }),
    [page, search],
  );

  const load = useCallback(async () => {
    try {
      const res = await blogApi.list(filters);
      setItems(res.data);
      setPagination(res.pagination ?? null);
      setLoadError(null);
    } catch (err) {
      setItems([]);
      setLoadError(err instanceof ApiError ? err.message : "Failed to load blog posts.");
    }
  }, [filters]);

  useEffect(() => {
    // setState runs only after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useRefreshOn("blog", load);

  async function confirmDelete() {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      await blogApi.remove(deleting.id);
      setItems((prev) => (prev ? prev.filter((b) => b.id !== deleting.id) : prev));
      setPagination((prev) => (prev ? { ...prev, total: Math.max(0, prev.total - 1) } : prev));
      invalidate("blog");
      notify("Blog post deleted.", "success");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to delete blog post.", "danger");
    } finally {
      setBusyId(null);
      setDeleting(null);
    }
  }

  const loading = items === null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Blog"
        subtitle={
          loading
            ? "Loading…"
            : pagination
              ? `${pagination.total} ${pagination.total === 1 ? "post" : "posts"}`
              : undefined
        }
        actions={<Button onClick={() => router.push("/blog/new")}>New Blog</Button>}
      />

      <div className="relative max-w-sm flex-1">
        <SearchIcon
          width={16}
          height={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-(--text-subtle)"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title…"
          className="h-9 w-full rounded-md border border-(--border) bg-(--surface) pl-9 pr-3 text-sm text-(--text) placeholder:text-(--text-subtle) outline-none transition-colors focus:border-(--accent)"
        />
      </div>

      {loadError && (
        <div className="flex items-center justify-between rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)">
          <span>{loadError}</span>
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      )}

      <Card>
        {!loading && items && items.length === 0 ? (
          <EmptyState
            icon={BlogIcon}
            title="No blog posts found"
            description={q ? "Try a different search." : "Create your first post to get started."}
          />
        ) : (
          <Table>
            <THead>
              <TH>Post</TH>
              <TH className="hidden sm:table-cell">Description</TH>
              <TH className="hidden md:table-cell">Created</TH>
              <TH className="text-right">Actions</TH>
            </THead>
            <TBody>
              {loading
                ? Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} />)
                : (items ?? []).map((blog) => (
                    <TR key={blog.id}>
                      <TD>
                        <div className="flex items-center gap-3">
                          {blog.image ? (
                            <img
                              src={mediaUrl(blog.image) ?? undefined}
                              alt={blog.title}
                              className="h-11 w-11 shrink-0 rounded-md border border-(--border) object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-(--border) bg-(--surface-2) text-(--text-subtle)">
                              <BlogIcon width={16} height={16} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link
                              href={`/blog/${blog.id}`}
                              className="block truncate font-medium text-(--text) hover:underline"
                            >
                              {blog.title}
                            </Link>
                            <span className="block truncate text-xs text-(--text-subtle)">/{blog.slug}</span>
                          </div>
                        </div>
                      </TD>
                      <TD className="hidden max-w-xs sm:table-cell text-(--text-muted)">
                        {blog.description ? (
                          <span className="block truncate">{blog.description}</span>
                        ) : (
                          <span className="text-(--text-subtle)">—</span>
                        )}
                      </TD>
                      <TD className="hidden whitespace-nowrap text-(--text-muted) md:table-cell">
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </TD>
                      <TD className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="secondary" size="sm" onClick={() => router.push(`/blog/${blog.id}/view`)}>
                            View
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => router.push(`/blog/${blog.id}`)}>
                            Edit
                          </Button>
                          <button
                            type="button"
                            onClick={() => setDeleting(blog)}
                            aria-label={`Delete blog post: ${blog.title}`}
                            title="Delete"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-(--text-muted) transition-colors hover:bg-(--danger-soft) hover:text-(--danger)"
                          >
                            <TrashIcon width={15} height={15} />
                          </button>
                        </div>
                      </TD>
                    </TR>
                  ))}
            </TBody>
          </Table>
        )}
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-(--text-muted)">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={pagination.page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete blog post">
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-(--text-secondary)">
              Delete <span className="font-semibold text-(--text)">{deleting.title}</span>? This will
              permanently delete the post and its cover image. There is no undo.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" disabled={busyId === deleting.id} onClick={() => void confirmDelete()}>
                {busyId === deleting.id ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function SkeletonRow() {
  return (
    <TR>
      <TD>
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 shrink-0 rounded-md" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
      </TD>
      <TD className="hidden sm:table-cell"><Skeleton className="h-4 w-full max-w-40 rounded" /></TD>
      <TD className="hidden md:table-cell"><Skeleton className="h-4 w-20 rounded" /></TD>
      <TD />
    </TR>
  );
}
