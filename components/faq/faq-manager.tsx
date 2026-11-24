"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TH, TBody } from "@/components/ui/table";
import {
  HelpIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  GripIcon,
} from "@/components/icons";
import { ApiError } from "@/lib/api";
import { faqApi, type Faq, type FaqInput } from "@/lib/faq";

type Dialog =
  | { mode: "create" }
  | { mode: "edit"; faq: Faq }
  | { mode: "delete"; faq: Faq }
  | null;

const byOrder = (a: Faq, b: Faq) => a.order - b.order || a.id - b.id;

export function FaqManager() {
  const [items, setItems] = useState<Faq[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [q, setQ] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);

  // Native drag-and-drop state (row indexes into the current list).
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await faqApi.list();
      setItems([...list].sort(byOrder));
      setLoadError(null);
    } catch (err) {
      setItems([]);
      setLoadError(
        err instanceof ApiError ? err.message : "Failed to load FAQs.",
      );
    }
  }, []);

  useEffect(() => {
    // setState runs only after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const term = q.trim().toLowerCase();
  const filtered = (items ?? []).filter(
    (f) =>
      !term ||
      f.question.toLowerCase().includes(term) ||
      f.answer.toLowerCase().includes(term),
  );
  // Reordering a filtered subset is ambiguous, so drag is only enabled
  // when the full, unfiltered list is showing.
  const canDrag = !term && !savingOrder;

  async function openEdit(faq: Faq) {
    try {
      const fresh = await faqApi.get(faq.id);
      setDialog({ mode: "edit", faq: fresh });
    } catch {
      setDialog({ mode: "edit", faq });
    }
  }

  async function handleSave(input: FaqInput) {
    if (dialog?.mode === "edit") {
      const updated = await faqApi.update(dialog.faq.id, input);
      setItems((prev) =>
        (prev ?? [])
          .map((f) => (f.id === updated.id ? updated : f))
          .sort(byOrder),
      );
    } else {
      const created = await faqApi.create(input);
      setItems((prev) => [...(prev ?? []), created].sort(byOrder));
    }
    setDialog(null);
  }

  async function handleDelete(faq: Faq) {
    await faqApi.remove(faq.id);
    setItems((prev) => (prev ?? []).filter((f) => f.id !== faq.id));
    setDialog(null);
  }

  async function commitReorder(from: number, to: number) {
    if (from === to || items === null) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    // Positions that actually changed get persisted (new order = index + 1).
    const changed = next
      .map((f, i) => ({ f, order: i + 1 }))
      .filter(({ f, order }) => f.order !== order);

    const previous = items;
    setItems(next.map((f, i) => ({ ...f, order: i + 1 })));
    setReorderError(null);
    setSavingOrder(true);
    try {
      await Promise.all(
        changed.map(({ f, order }) => faqApi.reorder(f.id, order)),
      );
    } catch (err) {
      setItems(previous);
      setReorderError(
        err instanceof ApiError ? err.message : "Failed to save new order.",
      );
    } finally {
      setSavingOrder(false);
    }
  }

  function onDrop(index: number) {
    if (dragIndex !== null) void commitReorder(dragIndex, index);
    setDragIndex(null);
    setOverIndex(null);
  }

  const loading = items === null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="FAQ"
        subtitle={
          loading
            ? "Loading…"
            : `${filtered.length} ${filtered.length === 1 ? "entry" : "entries"}`
        }
        actions={
          <Button onClick={() => setDialog({ mode: "create" })}>
            <PlusIcon width={16} height={16} />
            New FAQ
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm sm:w-72">
          <SearchIcon
            width={16}
            height={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-(--text-subtle)"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search questions or answers…"
            className="h-9 w-full rounded-md border border-(--border) bg-(--surface) pl-9 pr-3 text-sm text-(--text) placeholder:text-(--text-subtle) outline-none transition-colors focus:border-(--accent)"
          />
        </div>
        <p className="text-xs text-(--text-subtle)">
          {savingOrder
            ? "Saving order…"
            : term
              ? "Clear search to reorder"
              : "Drag rows to reorder"}
        </p>
      </div>

      {loadError && (
        <div className="flex items-center justify-between rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)">
          <span>{loadError}</span>
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      )}

      {reorderError && (
        <p
          role="alert"
          className="rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-2 text-sm text-(--danger)"
        >
          {reorderError}
        </p>
      )}

      <Card>
        {loading ? (
          <LoadingRows />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={HelpIcon}
            title={term ? "No FAQs match your search" : "No FAQs yet"}
            description={
              term
                ? "Try a different search term."
                : "Create the first FAQ to get started."
            }
          />
        ) : (
          <Table>
            <THead>
              <TH className="w-14 text-center">#</TH>
              <TH>Question</TH>
              <TH className="hidden md:table-cell">Answer</TH>
              <TH className="text-right">Actions</TH>
            </THead>
            <TBody>
              {filtered.map((f, index) => (
                <tr
                  key={f.id}
                  draggable={canDrag}
                  onDragStart={() => setDragIndex(index)}
                  onDragEnter={() => canDrag && setOverIndex(index)}
                  onDragOver={(e) => canDrag && e.preventDefault()}
                  onDrop={() => onDrop(index)}
                  onDragEnd={() => {
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  className={
                    "transition-colors hover:bg-(--surface-hover) " +
                    (canDrag ? "cursor-grab active:cursor-grabbing " : "") +
                    (dragIndex === index ? "opacity-50 " : "") +
                    (overIndex === index && dragIndex !== index
                      ? "border-t-2 border-(--accent) "
                      : "")
                  }
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 text-(--text-muted)">
                      {canDrag && (
                        <GripIcon
                          width={16}
                          height={16}
                          className="shrink-0 text-(--text-subtle)"
                        />
                      )}
                      <span className="tabular-nums">{index + 1}</span>
                    </div>
                  </td>
                  <td className="max-w-xs px-5 py-3 font-medium text-(--text)">
                    <span className="line-clamp-2">{f.question}</span>
                  </td>
                  <td className="hidden max-w-md px-5 py-3 text-(--text-secondary) md:table-cell">
                    <span className="line-clamp-2">{f.answer}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button
                        type="button"
                        onClick={() => void openEdit(f)}
                        aria-label={`Edit FAQ ${f.id}`}
                        title="Edit"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-(--text-muted) transition-colors hover:bg-(--surface-2) hover:text-(--text) cursor-pointer"
                      >
                        <PencilIcon width={15} height={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDialog({ mode: "delete", faq: f })}
                        aria-label={`Delete FAQ ${f.id}`}
                        title="Delete"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-(--text-muted) transition-colors hover:bg-(--danger-soft) hover:text-(--danger) cursor-pointer"
                      >
                        <TrashIcon width={15} height={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Modal
        open={dialog?.mode === "create" || dialog?.mode === "edit"}
        onClose={() => setDialog(null)}
        title={dialog?.mode === "edit" ? "Edit FAQ" : "New FAQ"}
      >
        <FaqForm
          key={dialog?.mode === "edit" ? dialog.faq.id : "create"}
          initial={dialog?.mode === "edit" ? dialog.faq : undefined}
          submitLabel={dialog?.mode === "edit" ? "Save changes" : "Create"}
          onSubmit={handleSave}
          onCancel={() => setDialog(null)}
        />
      </Modal>

      <Modal
        open={dialog?.mode === "delete"}
        onClose={() => setDialog(null)}
        title="Delete FAQ"
      >
        {dialog?.mode === "delete" && (
          <DeleteConfirm
            faq={dialog.faq}
            onConfirm={handleDelete}
            onCancel={() => setDialog(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="animate-pulse space-y-3 p-5">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-9 rounded-md bg-(--surface-2)" />
      ))}
    </div>
  );
}

const fieldClass =
  "w-full rounded-md border border-(--border) bg-(--background) px-3 text-sm text-(--text) placeholder:text-(--text-subtle) outline-none transition-colors focus:border-(--accent)";

function FaqForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Faq;
  submitLabel: string;
  onSubmit: (input: FaqInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit({ question: question.trim(), answer: answer.trim() });
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
          Question
        </label>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          minLength={5}
          maxLength={200}
          placeholder="e.g. How do I reset my password?"
          className={`${fieldClass} h-10`}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-(--text-secondary)">
          Answer
        </label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          required
          minLength={10}
          rows={4}
          placeholder="Write the answer (at least 10 characters)…"
          className={`${fieldClass} resize-none py-2`}
        />
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
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function DeleteConfirm({
  faq,
  onConfirm,
  onCancel,
}: {
  faq: Faq;
  onConfirm: (f: Faq) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function run() {
    setError(null);
    setDeleting(true);
    try {
      await onConfirm(faq);
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
        Delete this FAQ?{" "}
        <span className="font-semibold text-(--text)">{faq.question}</span> This
        action cannot be undone.
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
          onClick={() => void run()}
        >
          {deleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </div>
  );
}
