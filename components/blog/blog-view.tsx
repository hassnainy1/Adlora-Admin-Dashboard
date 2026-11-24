"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeftIcon, BlogIcon } from "@/components/icons";
import { ApiError, mediaUrl } from "@/lib/api";
import { blogApi, type Blog } from "@/lib/blog";

export function BlogView({ id }: { id: string }) {
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "notfound" | "error">("loading");
  const [loadErrorMsg, setLoadErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const data = await blogApi.get(id);
      setBlog(data);
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

  if (loadState === "loading") {
    return (
      <div className="min-h-full space-y-6 bg-(--surface-2) p-4 py-8 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-3xl space-y-5">
          <Skeleton className="h-7 w-48 rounded" />
          <Card className="space-y-4 rounded-xl p-6 shadow-sm sm:p-10">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <Skeleton className="h-8 w-2/3 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
          </Card>
        </div>
      </div>
    );
  }

  if (loadState === "notfound") {
    return (
      <div className="min-h-full bg-(--surface-2) p-4 py-8 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-3xl">
          <EmptyState icon={BlogIcon} title="Blog post not found" description="It may have been deleted." />
        </div>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="min-h-full bg-(--surface-2) p-4 py-8 sm:p-6 lg:p-8">
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <div className="flex items-center justify-between rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)">
            <span>{loadErrorMsg}</span>
            <Button variant="secondary" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) return null;

  return (
    <div className="min-h-full bg-(--surface-2) py-8">
      <div className="mx-auto w-full max-w-3xl space-y-5 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/blog"
              className="flex h-8 w-8 items-center justify-center rounded-md text-(--text-muted) transition-colors hover:bg-(--surface) hover:text-(--text)"
              aria-label="Back to blog list"
            >
              <ArrowLeftIcon width={16} height={16} />
            </Link>
            <h1 className="text-xl font-semibold tracking-tight text-(--text)">View Blog Post</h1>
          </div>
        </div>

        <Card className="rounded-xl shadow-sm">
          <div className="space-y-7 p-6 sm:p-10">
            {blog.image && (
              <img
                src={mediaUrl(blog.image) ?? undefined}
                alt={blog.imageAlt ?? blog.title}
                className="aspect-video w-full rounded-xl object-cover shadow-sm"
              />
            )}

            <div className="space-y-3 border-b border-(--border-subtle) pb-7">
              <div className="flex flex-wrap items-center gap-2 text-xs text-(--text-subtle)">
                <span className="rounded-full bg-(--surface-2) px-2.5 py-1 font-mono">/{blog.slug}</span>
                <span>·</span>
                <time dateTime={blog.createdAt}>
                  {new Date(blog.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-(--text) sm:text-4xl">
                {blog.title}
              </h2>
              {blog.description && (
                <p className="text-lg leading-relaxed text-(--text-muted)">{blog.description}</p>
              )}
            </div>

            <div
              className={[
                "prose-editor max-w-none text-[16px] leading-relaxed text-(--text-secondary)",
                "[&>*+*]:mt-5",
                "[&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_h4]:text-base [&_h5]:text-sm [&_h6]:text-xs",
                "[&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_h4]:font-semibold [&_h5]:font-semibold [&_h6]:font-semibold",
                "[&_h6]:uppercase [&_h6]:tracking-wide",
                "[&_h1]:mt-10 [&_h2]:mt-10 [&_h3]:mt-8 [&_h4]:mt-6 [&_h5]:mt-6 [&_h6]:mt-6",
                "[&_h1]:mb-3 [&_h2]:mb-3 [&_h3]:mb-2 [&_h4]:mb-2 [&_h5]:mb-2 [&_h6]:mb-2",
                "[&_h1]:text-(--text) [&_h2]:text-(--text) [&_h3]:text-(--text) [&_h4]:text-(--text) [&_h5]:text-(--text) [&_h6]:text-(--text)",
                "[&_figure_img]:w-full [&_figure_img]:rounded-xl",
                "[&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-(--text-muted)",
                "[&_p]:text-(--text-secondary)",
                "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5",
                "[&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5",
                "[&_li]:text-(--text-secondary)",
                "[&_a]:text-(--accent) [&_a]:underline [&_a]:underline-offset-2",
                "[&_strong]:font-semibold [&_strong]:text-(--text)",
              ].join(" ")}
              dangerouslySetInnerHTML={{ __html: blog.contentHtml }}
            />
          </div>
        </Card>

        <BlogSeoSummary blog={blog} />
      </div>
    </div>
  );
}

/** Read-only SEO fields, so admins can check what search engines will see. */
function BlogSeoSummary({ blog }: { blog: Blog }) {
  const rows: { label: string; value: string | null; fallback?: string }[] = [
    { label: "Meta title", value: blog.metaTitle, fallback: blog.title },
    { label: "Meta description", value: blog.metaDescription, fallback: blog.description ?? undefined },
    { label: "Cover alt text", value: blog.imageAlt },
  ];

  return (
    <Card className="space-y-4 rounded-xl p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-(--text)">SEO</h2>
      <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-(--text-muted)">{row.label}</dt>
            <dd className="text-(--text)">
              {row.value || (
                <span className="text-(--text-subtle)">
                  {row.fallback ? `Not set — uses “${row.fallback}”` : "Not set"}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {blog.schema && (
        <div className="space-y-1.5">
          <p className="text-sm text-(--text-muted)">Schema (JSON-LD)</p>
          <pre className="max-h-64 overflow-auto rounded-md bg-(--surface-2) p-3 font-mono text-xs text-(--text-secondary)">
            {blog.schema}
          </pre>
        </div>
      )}
    </Card>
  );
}
