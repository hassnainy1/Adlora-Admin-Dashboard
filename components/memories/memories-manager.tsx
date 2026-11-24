"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { MemoriesIcon, SearchIcon, CheckIcon, FlagIcon, TrashIcon } from "@/components/icons";
import { ApiError, mediaUrl } from "@/lib/api";
import type { Pagination } from "@/lib/api";
import {
  memoriesApi,
  memoryOwnerName,
  memoryTitle,
  memoryCoverUrl,
  rawMemoryStatusToFriendly,
  MODERATE_ACTION_STATUS,
  MEMORY_TYPE_TABS,
  MEMORY_STATUS_TABS,
  MEMORY_PRIVACY_LABEL,
  type AdminMemory,
  type MemoryType,
  type MemoryStatus,
  type ModerateAction,
} from "@/lib/memories";
import {
  tattoosApi,
  tattooCoverMedia,
  tattooGradientClass,
  placementLabel,
  type AdminTattooDetail,
} from "@/lib/tattoos";
import { cn } from "@/lib/cn";

const LIMIT = 20;

const statusTone: Record<MemoryStatus, BadgeTone> = {
  published: "success",
  flagged: "warning",
  removed: "danger",
};

const typeTone: Record<MemoryType, BadgeTone> = {
  text: "neutral",
  image: "info",
  video: "accent",
};

/** flag/remove increment the owner's violation strikes — always ask for a note. */
const NOTE_REQUIRED: ModerateAction[] = ["flag", "remove"];

export function MemoriesManager() {
  const [items, setItems] = useState<AdminMemory[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [typeTab, setTypeTab] = useState<MemoryType | "all">("all");
  const [statusTab, setStatusTab] = useState<MemoryStatus | "all">("all");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<{ memory: AdminMemory; action: ModerateAction; label: string } | null>(null);
  const [note, setNote] = useState("");
  const [viewing, setViewing] = useState<AdminMemory | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  const filters = useMemo(
    () => ({
      page,
      limit: LIMIT,
      search: search || undefined,
      type: typeTab === "all" ? undefined : typeTab,
      status: statusTab === "all" ? undefined : statusTab,
    }),
    [page, search, typeTab, statusTab],
  );

  const load = useCallback(async () => {
    try {
      const res = await memoriesApi.list(filters);
      setItems(res.data);
      setPagination(res.pagination ?? null);
      setLoadError(null);
    } catch (err) {
      setItems([]);
      setLoadError(err instanceof ApiError ? err.message : "Failed to load memories.");
    }
  }, [filters]);

  useEffect(() => {
    // setState runs only after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function setTypeTabAndReset(next: MemoryType | "all") {
    setTypeTab(next);
    setPage(1);
  }

  function setStatusTabAndReset(next: MemoryStatus | "all") {
    setStatusTab(next);
    setPage(1);
  }

  async function runAction(memory: AdminMemory, action: ModerateAction, adminNote?: string) {
    setBusyId(memory.id);
    setRowError(null);
    try {
      // The endpoint returns no body — the new status is deterministic from the action itself.
      await memoriesApi.moderate(memory.id, action, adminNote || undefined);
      const newStatus = MODERATE_ACTION_STATUS[action];
      setItems((prev) => {
        if (!prev) return prev;
        if (statusTab !== "all" && rawMemoryStatusToFriendly(newStatus) !== statusTab) {
          return prev.filter((m) => m.id !== memory.id);
        }
        return prev.map((m) => (m.id === memory.id ? { ...m, status: newStatus } : m));
      });
      setViewing((v) => (v && v.id === memory.id ? { ...v, status: newStatus } : v));
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Failed to update memory.");
    } finally {
      setBusyId(null);
    }
  }

  function requestAction(memory: AdminMemory, action: ModerateAction, label: string) {
    if (NOTE_REQUIRED.includes(action)) {
      setNote("");
      setConfirming({ memory, action, label });
    } else {
      void runAction(memory, action);
    }
  }

  async function confirmAction() {
    if (!confirming) return;
    await runAction(confirming.memory, confirming.action, note.trim());
    setConfirming(null);
  }

  const loading = items === null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Memories"
        subtitle={
          loading
            ? "Loading…"
            : pagination
              ? `${pagination.total} ${pagination.total === 1 ? "memory" : "memories"}`
              : undefined
        }
      />

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1 overflow-x-auto rounded-md border border-(--border) bg-(--surface) p-1">
            {MEMORY_TYPE_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTypeTabAndReset(t.value)}
                className={cn(
                  "shrink-0 rounded px-3 py-1.5 text-xs font-medium transition-colors",
                  typeTab === t.value
                    ? "bg-(--accent) text-(--accent-foreground)"
                    : "text-(--text-muted) hover:bg-(--surface-2) hover:text-(--text)",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative max-w-xs sm:w-72">
            <SearchIcon
              width={16}
              height={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-(--text-subtle)"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, tattoo or owner…"
              className="h-9 w-full rounded-md border border-(--border) bg-(--surface) pl-9 pr-3 text-sm text-(--text) placeholder:text-(--text-subtle) outline-none transition-colors focus:border-(--accent)"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto rounded-md border border-(--border-subtle) bg-(--surface-2) p-1">
          {MEMORY_STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setStatusTabAndReset(t.value)}
              className={cn(
                "shrink-0 rounded px-3 py-1 text-xs font-medium transition-colors",
                statusTab === t.value
                  ? "bg-(--surface) text-(--text) shadow-sm"
                  : "text-(--text-muted) hover:text-(--text)",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div className="flex items-center justify-between rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)">
          <span>{loadError}</span>
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      )}

      {rowError && (
        <p role="alert" className="rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-2 text-sm text-(--danger)">
          {rowError}
        </p>
      )}

      {!loading && items && items.length === 0 ? (
        <Card>
          <EmptyState
            icon={MemoriesIcon}
            title="No memories found"
            description={search ? "Try a different search." : "Nothing in this filter."}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
            : (items ?? []).map((m) => {
                const status = rawMemoryStatusToFriendly(m.status);
                const busy = busyId === m.id;
                const cover = mediaUrl(memoryCoverUrl(m));
                return (
                  <Card
                    key={m.id}
                    className="group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgb(0_0_0/0.18)]"
                  >
                    <button
                      type="button"
                      onClick={() => setViewing(m)}
                      className={cn(
                        "relative flex h-36 w-full items-center justify-center overflow-hidden",
                        !cover && "bg-linear-to-br",
                        !cover && tattooGradientClass(m.id),
                      )}
                    >
                      {cover ? (
                        <img src={cover} alt={memoryTitle(m)} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-white/90">{memoryTitle(m).charAt(0).toUpperCase()}</span>
                      )}
                      <span className="absolute top-2 left-2">
                        <Badge tone={typeTone[m.type]} className="capitalize shadow-sm">{m.type}</Badge>
                      </span>
                      <span className="absolute top-2 right-2">
                        <Badge tone={statusTone[status]} className="shadow-sm">{status}</Badge>
                      </span>
                    </button>
                    <div className="p-4">
                      <button type="button" onClick={() => setViewing(m)} className="block w-full text-left">
                        <h3 className="truncate font-semibold text-(--text) hover:text-(--accent)">
                          {memoryTitle(m)}
                        </h3>
                      </button>
                      {m.story && <p className="line-clamp-2 text-sm text-(--text-muted)">{m.story}</p>}
                      <p className="mt-2 truncate text-xs text-(--text-subtle)">
                        by {memoryOwnerName(m)} · {m.tattoo?.title || `Tattoo #${m.tattoo?.id ?? "—"}`}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs text-(--text-subtle)">
                        <Badge tone="neutral">{MEMORY_PRIVACY_LABEL[m.privacy] ?? m.privacy}</Badge>
                        <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-(--border-subtle) pt-3">
                        {status !== "published" && (
                          <Button size="sm" variant="secondary" disabled={busy} onClick={() => requestAction(m, "approve", "Approve")}>
                            <CheckIcon width={14} height={14} /> Approve
                          </Button>
                        )}
                        {status !== "flagged" && (
                          <Button size="sm" variant="secondary" disabled={busy} onClick={() => requestAction(m, "flag", "Flag")}>
                            <FlagIcon width={14} height={14} /> Flag
                          </Button>
                        )}
                        {status !== "removed" && (
                          <Button size="sm" variant="danger" disabled={busy} onClick={() => requestAction(m, "remove", "Remove")}>
                            <TrashIcon width={14} height={14} /> Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-(--text-muted)">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={pagination.page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal open={confirming !== null} onClose={() => setConfirming(null)} title={confirming ? `${confirming.label} memory?` : ""}>
        {confirming && (
          <div className="space-y-4">
            <p className="text-sm text-(--text-secondary)">
              {confirming.label} “{memoryTitle(confirming.memory)}” by {memoryOwnerName(confirming.memory)}?
              {confirming.action !== "approve" && " This counts toward the owner's violation strikes."}
            </p>
            <label className="block text-sm font-medium text-(--text-secondary)">
              Admin note <span className="font-normal text-(--text-subtle)">(optional)</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Reason for this decision…"
                className="mt-1.5 w-full rounded-md border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text) placeholder:text-(--text-subtle) outline-none transition-colors focus:border-(--accent)"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirming(null)}>
                Cancel
              </Button>
              <Button
                variant={confirming.action === "remove" ? "danger" : "primary"}
                size="sm"
                disabled={busyId === confirming.memory.id}
                onClick={() => void confirmAction()}
              >
                {busyId === confirming.memory.id ? "…" : confirming.label}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <MemoryDetailModal
        memory={viewing}
        busy={viewing !== null && busyId === viewing.id}
        onClose={() => setViewing(null)}
        onAction={(action, label) => viewing && requestAction(viewing, action, label)}
      />
    </div>
  );
}

function MemoryDetailModal({
  memory,
  busy,
  onClose,
  onAction,
}: {
  memory: AdminMemory | null;
  busy: boolean;
  onClose: () => void;
  onAction: (action: ModerateAction, label: string) => void;
}) {
  const [tattoo, setTattoo] = useState<AdminTattooDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!memory) {
      // setState runs only for the prop-driven reset — no render loop.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTattoo(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    // No dedicated single-memory admin endpoint exists (the owner-scoped one
    // 404s for content an admin doesn't own) — the linked tattoo's own detail
    // API is the closest admin-visible context, so pull that for the media/
    // author panel and layer the memory's own fields on top.
    tattoosApi
      .get(memory.tattoo.id)
      .then(setTattoo)
      .catch((err) =>
        setError(
          err instanceof ApiError && err.status === 404
            ? "The linked tattoo is private — showing memory details only."
            : err instanceof ApiError
              ? err.message
              : "Failed to load the linked tattoo.",
        ),
      )
      .finally(() => setLoading(false));
  }, [memory]);

  if (!memory) return null;
  const status = rawMemoryStatusToFriendly(memory.status);
  const cover = tattoo ? tattooCoverMedia(tattoo) : null;
  const linkedTitle = tattoo?.title || memory.tattoo?.title || `Tattoo #${memory.tattoo?.id ?? "—"}`;

  return (
    <Modal open={memory !== null} onClose={onClose} title={memoryTitle(memory)} size="lg">
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-48 rounded-md bg-(--surface-2)" />
          <div className="h-4 w-40 rounded bg-(--surface-2)" />
          <div className="h-20 rounded bg-(--surface-2)" />
        </div>
      ) : (
        <div className="space-y-5">
          {error && (
            <p className="rounded-md border border-(--warning) bg-(--warning-soft) px-3 py-2 text-sm text-(--warning)">
              {error}
            </p>
          )}

          {tattoo && tattoo.media.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {tattoo.media.map((mm) => (
                <img
                  key={mm.id}
                  src={mediaUrl(mm.thumbnailUrl ?? mm.fileUrl) ?? undefined}
                  alt={linkedTitle}
                  className="aspect-square w-full rounded-md border border-(--border) object-cover"
                />
              ))}
            </div>
          ) : cover ? null : (
            <div className={cn("flex h-40 items-center justify-center rounded-md bg-linear-to-br text-3xl font-bold text-white/90", tattooGradientClass(memory.id))}>
              {memoryTitle(memory).charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={statusTone[status]}>{status}</Badge>
            <Badge tone={typeTone[memory.type]} className="capitalize">{memory.type}</Badge>
            <Badge tone="neutral">{MEMORY_PRIVACY_LABEL[memory.privacy] ?? memory.privacy}</Badge>
          </div>

          {memory.story && <p className="text-sm text-(--text-secondary)">{memory.story}</p>}

          <div className="flex items-center gap-3 border-t border-(--border-subtle) pt-4">
            {tattoo?.author?.profileImageUrl ? (
              <img
                src={mediaUrl(tattoo.author.profileImageUrl) ?? undefined}
                alt={memoryOwnerName(memory)}
                className="h-11 w-11 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--accent-soft) text-sm font-semibold text-(--accent)">
                {memoryOwnerName(memory).charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-(--text)">{memoryOwnerName(memory)}</p>
              <p className="truncate text-xs text-(--text-muted)">
                {tattoo?.author?.role ?? "USER"}
                {tattoo?.author?.averageRating != null && ` · ★ ${tattoo.author.averageRating.toFixed(1)} (${tattoo.author.reviewCount})`}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Detail label="Linked tattoo" value={linkedTitle} />
            <Detail label="Placement" value={tattoo ? (placementLabel(tattoo.bodyPlacement) ?? "—") : "—"} />
            <Detail label="Styles" value={tattoo ? (tattoo.styles.map((s) => s.name).join(", ") || "—") : "—"} />
            <Detail label="Category" value={tattoo?.category?.name ?? "—"} />
            <Detail label="Type" value={memory.type} />
            <Detail label="Created" value={new Date(memory.createdAt).toLocaleString()} />
          </dl>

          <div className="flex flex-wrap gap-2 border-t border-(--border-subtle) pt-4">
            {status !== "published" && (
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => onAction("approve", "Approve")}>
                <CheckIcon width={14} height={14} /> Approve
              </Button>
            )}
            {status !== "flagged" && (
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => onAction("flag", "Flag")}>
                <FlagIcon width={14} height={14} /> Flag
              </Button>
            )}
            {status !== "removed" && (
              <Button size="sm" variant="danger" disabled={busy} onClick={() => onAction("remove", "Remove")}>
                <TrashIcon width={14} height={14} /> Remove
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-(--border-subtle) py-1.5">
      <dt className="text-(--text-muted)">{label}</dt>
      <dd className="truncate text-right font-medium text-(--text)">{value}</dd>
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card className="overflow-hidden">
      <div className="h-36 animate-pulse bg-(--surface-2)" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-(--surface-2)" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-(--surface-2)" />
        <div className="mt-3 h-8 w-full animate-pulse rounded-md bg-(--surface-2)" />
      </div>
    </Card>
  );
}
