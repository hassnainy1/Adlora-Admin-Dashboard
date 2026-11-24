"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { CloseIcon, PlusIcon } from "@/components/icons";
import { ApiError } from "@/lib/api";
import { pagesApi, slugify, type Page, type PageInput } from "@/lib/pages";

type DialogState = { mode: "create" } | { mode: "delete"; page: Page } | null;

export function PagesManager() {
  const [pages, setPages] = useState<Page[] | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);

  const load = useCallback(async () => {
    try {
      const list = await pagesApi.list();
      setPages(list);
      setLoadError(null);
      setActiveId((prev) =>
        prev && list.some((p) => p.id === prev) ? prev : (list[0]?.id ?? null),
      );
    } catch (err) {
      setPages([]);
      setLoadError(
        err instanceof ApiError ? err.message : "Failed to load pages.",
      );
    }
  }, []);

  useEffect(() => {
    // setState runs only after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function handleCreated(page: Page) {
    setPages((prev) => [...(prev ?? []), page]);
    setActiveId(page.id);
    setDialog(null);
  }

  function handleUpdated(page: Page) {
    setPages((prev) =>
      (prev ?? []).map((p) => (p.id === page.id ? page : p)),
    );
  }

  async function handleDelete(page: Page) {
    await pagesApi.remove(page.id);
    setPages((prev) => {
      const next = (prev ?? []).filter((p) => p.id !== page.id);
      setActiveId((current) =>
        current === page.id ? (next[0]?.id ?? null) : current,
      );
      return next;
    });
    setDialog(null);
  }

  const loading = pages === null;
  const active = pages?.find((p) => p.id === activeId) ?? null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Pages"
        subtitle="Edit the platform's legal and help content"
        actions={
          <Button onClick={() => setDialog({ mode: "create" })}>
            <PlusIcon width={16} height={16} />
            New page
          </Button>
        }
      />

      {loadError && (
        <div className="flex items-center justify-between rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)">
          <span>{loadError}</span>
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex gap-1.5 border-b border-(--border) pb-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-36" />
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 border-b border-(--border)">
          {pages!.map((page) => (
            <div
              key={page.id}
              className={
                "group -mb-px flex items-center gap-1.5 rounded-t-md border-b-2 pl-4 pr-2 text-sm font-medium transition-colors " +
                (active?.id === page.id
                  ? "border-(--accent) text-(--accent)"
                  : "border-transparent text-(--text-muted) hover:text-(--text)")
              }
            >
              <button
                type="button"
                onClick={() => setActiveId(page.id)}
                className="h-9 cursor-pointer"
              >
                {page.title}
              </button>
              <button
                type="button"
                onClick={() => setDialog({ mode: "delete", page })}
                aria-label={`Delete ${page.title}`}
                title="Delete page"
                className="flex h-6 w-6 items-center justify-center rounded text-(--text-subtle) opacity-0 transition-colors group-hover:opacity-100 hover:bg-(--danger-soft) hover:text-(--danger)"
              >
                <CloseIcon width={12} height={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && pages!.length === 0 && (
        <p className="py-10 text-center text-sm text-(--text-muted)">
          No pages yet. Create one to get started.
        </p>
      )}

      {active && <PageEditor key={active.id} page={active} onSaved={handleUpdated} />}

      <Modal
        open={dialog?.mode === "create"}
        onClose={() => setDialog(null)}
        title="New page"
        size="lg"
      >
        <CreatePageForm onCreated={handleCreated} onCancel={() => setDialog(null)} />
      </Modal>

      <Modal
        open={dialog?.mode === "delete"}
        onClose={() => setDialog(null)}
        title="Delete page"
      >
        {dialog?.mode === "delete" && (
          <DeletePageConfirm
            page={dialog.page}
            onConfirm={handleDelete}
            onCancel={() => setDialog(null)}
          />
        )}
      </Modal>
    </div>
  );
}

const fieldClass =
  "w-full rounded-md border border-(--border) bg-(--background) px-3 text-sm text-(--text) placeholder:text-(--text-subtle) outline-none transition-colors focus:border-(--accent)";

function CreatePageForm({
  onCreated,
  onCancel,
}: {
  onCreated: (page: Page) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const page = await pagesApi.upsert({
        title: title.trim(),
        slug: (slugTouched ? slug : slugify(title)).trim(),
        content,
      });
      onCreated(page);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-(--text-secondary)">
          Title
        </label>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          required
          maxLength={100}
          placeholder="e.g. Community Guidelines"
          className={`${fieldClass} h-10`}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-(--text-secondary)">
          Slug
        </label>
        <input
          value={slug}
          onChange={(e) => {
            setSlug(slugify(e.target.value));
            setSlugTouched(true);
          }}
          required
          maxLength={100}
          placeholder="e.g. community-guidelines"
          className={`${fieldClass} h-10 font-mono`}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-(--text-secondary)">
          Content
        </label>
        <RichTextEditor value={content} onChange={setContent} />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-(--danger) bg-(--danger-soft) px-3 py-2 text-sm text-(--danger)"
        >
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Creating…" : "Create"}
        </Button>
      </div>
    </form>
  );
}

function DeletePageConfirm({
  page,
  onConfirm,
  onCancel,
}: {
  page: Page;
  onConfirm: (page: Page) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirm() {
    setError(null);
    setDeleting(true);
    try {
      await onConfirm(page);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to delete. Please try again.",
      );
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-(--text-secondary)">
        Delete the page{" "}
        <span className="font-semibold text-(--text)">{page.title}</span>?
        This action cannot be undone.
      </p>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-(--danger) bg-(--danger-soft) px-3 py-2 text-sm text-(--danger)"
        >
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={deleting}
          onClick={() => void confirm()}
        >
          {deleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </div>
  );
}

function PageEditor({
  page,
  onSaved,
}: {
  page: Page;
  onSaved: (page: Page) => void;
}) {
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const input: PageInput = {
        id: page.id,
        title: title.trim(),
        slug: page.slug,
        content,
      };
      const updated = await pagesApi.upsert(input);
      onSaved(updated);
      setSaved(true);
    } catch (err) {
      setSaveError(
        err instanceof ApiError
          ? err.message
          : "Failed to save. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-(--text-secondary)">
          Title
        </label>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSaved(false);
          }}
          className={`${fieldClass} h-10`}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-(--text-secondary)">
          Content
        </label>
        <RichTextEditor
          value={content}
          onChange={(html) => {
            setContent(html);
            setSaved(false);
          }}
        />
      </div>

      {saveError && (
        <p
          role="alert"
          className="rounded-md border border-(--danger) bg-(--danger-soft) px-3 py-2 text-sm text-(--danger)"
        >
          {saveError}
        </p>
      )}

      {/* Pinned to the bottom of the scrolling <main> so long pages can be saved without scrolling back down. */}
      <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-(--border) bg-(--background)/90 py-3 backdrop-blur">
        {saved && <span className="text-sm text-(--success)">Saved</span>}
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
