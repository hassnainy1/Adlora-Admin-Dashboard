"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  TagIcon,
  StyleIcon,
  type Icon,
} from "@/components/icons";
import {
  catalogApi,
  type CatalogInput,
  type CatalogItem,
  type CatalogResource,
} from "@/lib/catalog";
import { ApiError } from "@/lib/api";

type DialogState =
  | { mode: "create" }
  | { mode: "edit"; item: CatalogItem }
  | { mode: "delete"; item: CatalogItem }
  | null;

const byName = (a: CatalogItem, b: CatalogItem) => a.name.localeCompare(b.name);

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Icons stay here (not passed as props) so pages can remain server components.
const resourceIcons: Record<CatalogResource, Icon> = {
  specialities: TagIcon,
  styles: StyleIcon,
};

export function CatalogManager({
  resource,
  title,
  singular,
}: {
  resource: CatalogResource;
  title: string;
  /** Lowercase singular label, e.g. "speciality" — used in buttons and dialogs. */
  singular: string;
}) {
  const api = useMemo(() => catalogApi(resource), [resource]);
  const icon = resourceIcons[resource];

  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);

  const load = useCallback(async () => {
    try {
      const list = await api.list();
      setItems([...list].sort(byName));
      setLoadError(null);
    } catch (err) {
      setItems([]);
      setLoadError(
        err instanceof ApiError ? err.message : "Failed to load data.",
      );
    }
  }, [api]);

  useEffect(() => {
    // setState only happens after the fetch resolves, so no render loop here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const term = q.trim().toLowerCase();
  const filtered = (items ?? []).filter(
    (i) =>
      !term ||
      i.name.toLowerCase().includes(term) ||
      i.description.toLowerCase().includes(term),
  );

  async function openEdit(item: CatalogItem) {
    // Fetch by id so the form always edits fresh data.
    try {
      const fresh = await api.get(item.id);
      setDialog({ mode: "edit", item: fresh });
    } catch {
      setDialog({ mode: "edit", item });
    }
  }

  async function handleSave(input: CatalogInput) {
    if (dialog?.mode === "edit") {
      const updated = await api.update(dialog.item.id, input);
      setItems((prev) =>
        (prev ?? [])
          .map((i) => (i.id === updated.id ? updated : i))
          .sort(byName),
      );
    } else {
      const created = await api.create(input);
      setItems((prev) => [...(prev ?? []), created].sort(byName));
    }
    setDialog(null);
  }

  async function handleDelete(item: CatalogItem) {
    await api.remove(item.id);
    setItems((prev) => (prev ?? []).filter((i) => i.id !== item.id));
    setDialog(null);
  }

  const loading = items === null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={title}
        subtitle={
          loading
            ? "Loading…"
            : `${filtered.length} ${filtered.length === 1 ? singular : title.toLowerCase()} found`
        }
        actions={
          <Button onClick={() => setDialog({ mode: "create" })}>
            <PlusIcon width={16} height={16} />
            New {singular}
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <SearchIcon
          width={16}
          height={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-(--text-subtle)"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${title.toLowerCase()}…`}
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
        {!loading && filtered.length === 0 ? (
          <EmptyState
            icon={icon}
            title={
              term
                ? `No ${title.toLowerCase()} match your search`
                : `No ${title.toLowerCase()} yet`
            }
            description={
              term
                ? "Try a different search term."
                : `Create the first ${singular} to get started.`
            }
          />
        ) : (
          <Table>
            <THead>
              <TH>Name</TH>
              <TH>Description</TH>
              <TH>Created</TH>
              <TH>Updated</TH>
              <TH className="text-right">Actions</TH>
            </THead>
            <TBody>
              {loading ? (
                <SkeletonRows />
              ) : (
                filtered.map((item) => (
                <TR key={item.id}>
                  <TD className="font-medium text-(--text)">{item.name}</TD>
                  <TD className="max-w-md">
                    <span className="line-clamp-2">{item.description}</span>
                  </TD>
                  <TD className="whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </TD>
                  <TD className="whitespace-nowrap">
                    {formatDate(item.updatedAt)}
                  </TD>
                  <TD className="text-right">
                    <div className="inline-flex gap-1">
                      <button
                        type="button"
                        onClick={() => void openEdit(item)}
                        aria-label={`Edit ${item.name}`}
                        title="Edit"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-(--text-muted) transition-colors hover:bg-(--surface-2) hover:text-(--text) cursor-pointer"
                      >
                        <PencilIcon width={15} height={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDialog({ mode: "delete", item })}
                        aria-label={`Delete ${item.name}`}
                        title="Delete"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-(--text-muted) transition-colors hover:bg-(--danger-soft) hover:text-(--danger) cursor-pointer"
                      >
                        <TrashIcon width={15} height={15} />
                      </button>
                    </div>
                  </TD>
                </TR>
                ))
              )}
            </TBody>
          </Table>
        )}
      </Card>

      <Modal
        open={dialog?.mode === "create" || dialog?.mode === "edit"}
        onClose={() => setDialog(null)}
        title={dialog?.mode === "edit" ? `Edit ${singular}` : `New ${singular}`}
      >
        <CatalogForm
          key={dialog?.mode === "edit" ? dialog.item.id : "create"}
          initial={dialog?.mode === "edit" ? dialog.item : undefined}
          submitLabel={dialog?.mode === "edit" ? "Save changes" : "Create"}
          onSubmit={handleSave}
          onCancel={() => setDialog(null)}
        />
      </Modal>

      <Modal
        open={dialog?.mode === "delete"}
        onClose={() => setDialog(null)}
        title={`Delete ${singular}`}
      >
        {dialog?.mode === "delete" && (
          <DeleteConfirm
            item={dialog.item}
            singular={singular}
            onConfirm={handleDelete}
            onCancel={() => setDialog(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <TR key={i}>
          <TD>
            <div className="h-4 w-32 animate-pulse rounded bg-(--surface-2)" />
          </TD>
          <TD>
            <div className="h-4 w-48 animate-pulse rounded bg-(--surface-2)" />
          </TD>
          <TD>
            <div className="h-4 w-20 animate-pulse rounded bg-(--surface-2)" />
          </TD>
          <TD>
            <div className="h-4 w-20 animate-pulse rounded bg-(--surface-2)" />
          </TD>
          <TD className="text-right">
            <div className="ml-auto h-4 w-16 animate-pulse rounded bg-(--surface-2)" />
          </TD>
        </TR>
      ))}
    </>
  );
}

const fieldClass =
  "w-full rounded-md border border-(--border) bg-(--background) px-3 text-sm text-(--text) placeholder:text-(--text-subtle) outline-none transition-colors focus:border-(--accent)";

function CatalogForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: CatalogInput;
  submitLabel: string;
  onSubmit: (input: CatalogInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim() });
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
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          placeholder="e.g. Neo Traditional"
          className={`${fieldClass} h-10`}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-(--text-secondary)">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          maxLength={500}
          placeholder="Short description…"
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
  item,
  singular,
  onConfirm,
  onCancel,
}: {
  item: CatalogItem;
  singular: string;
  onConfirm: (item: CatalogItem) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirm() {
    setError(null);
    setDeleting(true);
    try {
      await onConfirm(item);
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
        Delete the {singular}{" "}
        <span className="font-semibold text-(--text)">{item.name}</span>? This
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
          onClick={() => void confirm()}
        >
          {deleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </div>
  );
}
