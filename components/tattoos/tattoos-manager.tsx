"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { TattoosIcon, SearchIcon, HeartIcon, MessageIcon } from "@/components/icons";
import { ApiError, mediaUrl } from "@/lib/api";
import type { Pagination } from "@/lib/api";
import {
  tattoosApi,
  tattooOwnerName,
  tattooCoverMedia,
  tattooGradientClass,
  placementLabel,
  rawStatusToFriendly,
  TATTOO_STATUS_TABS,
  type AdminTattoo,
  type ModerateAction,
  type TattooStatus,
} from "@/lib/tattoos";
import { cn } from "@/lib/cn";
import { statusTone, NOTE_REQUIRED } from "@/components/tattoos/tattoo-status";
import { ModerationActions } from "@/components/tattoos/moderation-actions";
import { TattooDetailModal } from "@/components/tattoos/tattoo-detail-modal";

const LIMIT = 20;

export function TattoosManager() {
  const [items, setItems] = useState<AdminTattoo[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<TattooStatus | "all">("all");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<{ tattoo: AdminTattoo; action: ModerateAction; label: string } | null>(null);
  const [note, setNote] = useState("");
  const [viewing, setViewing] = useState<AdminTattoo | null>(null);
  const [deepLinkError, setDeepLinkError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const deepLinkTattooId = searchParams.get("tattooId");

  useEffect(() => {
    if (!deepLinkTattooId) return;
    const id = Number(deepLinkTattooId);
    if (!Number.isFinite(id)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeepLinkError(null);
    tattoosApi
      .get(id)
      .then((t) => setViewing(t))
      .catch(() => setDeepLinkError("That tattoo couldn't be found."));
  }, [deepLinkTattooId]);

  function closeViewing() {
    setViewing(null);
    if (deepLinkTattooId) router.replace("/tattoos");
  }

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
      status: tab === "all" ? undefined : tab,
    }),
    [page, search, tab],
  );

  const load = useCallback(async () => {
    try {
      const res = await tattoosApi.list(filters);
      setItems(res.data);
      setPagination(res.pagination ?? null);
      setLoadError(null);
    } catch (err) {
      setItems([]);
      setLoadError(err instanceof ApiError ? err.message : "Failed to load tattoos.");
    }
  }, [filters]);

  useEffect(() => {
    // setState runs only after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function setTabAndReset(next: TattooStatus | "all") {
    setTab(next);
    setPage(1);
  }

  /**
   * The API doesn't expose `deletedAt` on the response, so a "removed"
   * (soft-deleted) tattoo can't be told apart from an ACTIVE one once it
   * drops out of the moderation-filtered list. Inside a specific tab we can
   * trust the tab itself; only "All" falls back to the raw status enum.
   */
  function friendlyStatus(t: AdminTattoo): TattooStatus {
    if (tab !== "all") return tab;
    return rawStatusToFriendly(t.status);
  }

  async function runAction(tattoo: AdminTattoo, action: ModerateAction, adminNote?: string) {
    setBusyId(tattoo.id);
    setRowError(null);
    try {
      const updated = await tattoosApi.moderate(tattoo.id, action, adminNote || undefined);
      setItems((prev) => {
        if (!prev) return prev;
        if (updated === null) return prev.filter((t) => t.id !== tattoo.id);
        if (tab !== "all" && rawStatusToFriendly(updated.status) !== tab) {
          return prev.filter((t) => t.id !== tattoo.id);
        }
        return prev.map((t) => (t.id === updated.id ? updated : t));
      });
      setViewing((v) => (v && v.id === tattoo.id ? (updated ?? null) : v));
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Failed to update tattoo.");
    } finally {
      setBusyId(null);
    }
  }

  function requestAction(tattoo: AdminTattoo, action: ModerateAction, label: string) {
    if (NOTE_REQUIRED.includes(action)) {
      setNote("");
      setConfirming({ tattoo, action, label });
    } else {
      void runAction(tattoo, action);
    }
  }

  async function confirmAction() {
    if (!confirming) return;
    await runAction(confirming.tattoo, confirming.action, note.trim());
    setConfirming(null);
  }

  const loading = items === null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Tattoos"
        subtitle={
          loading
            ? "Loading…"
            : pagination
              ? `${pagination.total} ${pagination.total === 1 ? "tattoo" : "tattoos"}`
              : undefined
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto rounded-md border border-(--border) bg-(--surface) p-1">
          {TATTOO_STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTabAndReset(t.value)}
              className={cn(
                "shrink-0 rounded px-3 py-1.5 text-xs font-medium transition-colors",
                tab === t.value
                  ? "bg-(--accent) text-(--accent-foreground)"
                  : "text-(--text-muted) hover:bg-(--surface-2) hover:text-(--text)",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs sm:w-64">
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

      {deepLinkError && (
        <p role="alert" className="rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-2 text-sm text-(--danger)">
          {deepLinkError}
        </p>
      )}

      {!loading && items && items.length === 0 ? (
        <Card>
          <EmptyState
            icon={TattoosIcon}
            title="No tattoos found"
            description={search ? "Try a different search." : "Nothing in this filter."}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
            : (items ?? []).map((t) => {
                const status = friendlyStatus(t);
                const busy = busyId === t.id;
                const cover = tattooCoverMedia(t);
                const image = cover ? mediaUrl(cover.thumbnailUrl ?? cover.fileUrl) : null;
                return (
                  <Card
                    key={t.id}
                    className="group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgb(0_0_0/0.18)]"
                  >
                    <button
                      type="button"
                      onClick={() => setViewing(t)}
                      className={cn("relative flex h-36 w-full items-center justify-center overflow-hidden bg-linear-to-br", tattooGradientClass(t.id))}
                    >
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt={t.title ?? `Tattoo #${t.id}`} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-white/90">{(t.title?.charAt(0) ?? "?").toUpperCase()}</span>
                      )}
                      <span className="absolute top-2 right-2">
                        <Badge tone={statusTone[status]} className="shadow-sm">
                          {status}
                        </Badge>
                      </span>
                    </button>
                    <div className="p-4">
                      <button type="button" onClick={() => setViewing(t)} className="block w-full text-left">
                        <h3 className="truncate font-semibold text-(--text) hover:text-(--accent)">
                          {t.title || `Tattoo #${t.id}`}
                        </h3>
                      </button>
                      <p className="truncate text-sm text-(--text-muted)">by {tattooOwnerName(t)}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-(--text-subtle)">
                        <span className="truncate">
                          {[t.styles.map((s) => s.name).join(", "), placementLabel(t.bodyPlacement)].filter(Boolean).join(" · ") || "—"}
                        </span>
                        <span className="shrink-0 flex items-center gap-2">
                          <span className="inline-flex items-center gap-0.5"><HeartIcon width={12} height={12} />{t.likeCount}</span>
                          <span className="inline-flex items-center gap-0.5"><MessageIcon width={12} height={12} />{t.commentCount}</span>
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-(--border-subtle) pt-3">
                        <ModerationActions
                          status={status}
                          busy={busy}
                          onAction={(action, label) => requestAction(t, action, label)}
                        />
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

      <TattooDetailModal
        tattoo={viewing}
        friendlyStatus={viewing ? friendlyStatus(viewing) : "published"}
        busy={viewing !== null && busyId === viewing.id}
        onClose={closeViewing}
        onAction={(action, label) => viewing && requestAction(viewing, action, label)}
      />

      <Modal open={confirming !== null} onClose={() => setConfirming(null)} title={confirming ? `${confirming.label} tattoo?` : ""}>
        {confirming && (
          <div className="space-y-4">
            <p className="text-sm text-(--text-secondary)">
              {confirming.label} “{confirming.tattoo.title || `Tattoo #${confirming.tattoo.id}`}” by {tattooOwnerName(confirming.tattoo)}?
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
                disabled={busyId === confirming.tattoo.id}
                onClick={() => void confirmAction()}
              >
                {busyId === confirming.tattoo.id ? "…" : confirming.label}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-36" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-2/3 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
        <Skeleton className="mt-3 h-8 w-full rounded-md" />
      </div>
    </Card>
  );
}
