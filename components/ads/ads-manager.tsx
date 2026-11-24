"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table";
import { AdIcon, SearchIcon, TrashIcon } from "@/components/icons";
import { ApiError, mediaUrl } from "@/lib/api";
import type { Pagination } from "@/lib/api";
import { adsApi, creatorName, AD_STATUS_TONE, type Ad, type AdStatus } from "@/lib/ads";
import { useRefreshOn } from "@/lib/data-refresh";
import { cn } from "@/lib/cn";
import { AdFormModal } from "@/components/ads/ad-form-modal";

const LIMIT = 20;

type Tab = AdStatus | "ALL";
const TABS: { id: Tab; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
 
];

export function AdsManager() {
  const [ads, setAds] = useState<Ad[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<Tab>("ALL");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Ad | null>(null);
  const [deleting, setDeleting] = useState<Ad | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await adsApi.list({ page, limit: LIMIT, status: tab === "ALL" ? undefined : tab });
      setAds(res.data);
      setPagination(res.pagination ?? null);
      setLoadError(null);
    } catch (err) {
      setAds([]);
      setLoadError(err instanceof ApiError ? err.message : "Failed to load ads.");
    }
  }, [page, tab]);

  useEffect(() => {
    // setState only runs after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useRefreshOn("ads", load);

  function selectTab(next: Tab) {
    setTab(next);
    setPage(1);
  }

  async function approve(ad: Ad) {
    setBusyId(ad.id);
    setRowError(null);
    try {
      await adsApi.approve(ad.id);
      void load();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Failed to approve ad.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject(ad: Ad, reason: string) {
    await adsApi.reject(ad.id, reason || undefined);
    setRejecting(null);
    void load();
  }

  async function confirmDelete(ad: Ad) {
    await adsApi.remove(ad.id);
    setDeleting(null);
    void load();
  }

  const loading = ads === null;
  const term = q.trim().toLowerCase();
  const filtered = (ads ?? []).filter(
    (a) =>
      !term ||
      a.title.toLowerCase().includes(term) ||
      creatorName(a.createdBy).toLowerCase().includes(term) ||
      (a.createdBy.studioName ?? "").toLowerCase().includes(term),
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Ads"
        subtitle={
          loading
            ? "Loading…"
            : pagination
              ? `${pagination.total} ${pagination.total === 1 ? "ad" : "ads"}`
              : undefined
        }
        actions={<Button onClick={() => setCreating(true)}>Create Ad</Button>}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 border-b border-(--border)">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTab(t.id)}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                tab === t.id
                  ? "border-(--accent) text-(--text)"
                  : "border-transparent text-(--text-muted) hover:text-(--text)",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs flex-1">
          <SearchIcon
            width={16}
            height={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-(--text-subtle)"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title or artist…"
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

      <Card>
        {loading ? (
          <LoadingRows />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={AdIcon}
            title="No ads found"
            description={term ? "Try a different search." : "Nothing here yet."}
          />
        ) : (
          <Table>
            <THead>
              <TH>Ad</TH>
              <TH>Submitted by</TH>
              <TH className="hidden md:table-cell">Submitted</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </THead>
            <TBody>
              {filtered.map((ad) => {
                const busy = busyId === ad.id;
                return (
                  <TR key={ad.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <img
                          src={mediaUrl(ad.imageUrl) ?? undefined}
                          alt={ad.title}
                          className="h-11 w-11 shrink-0 rounded-md border border-(--border) object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-(--text)">{ad.title}</p>
                          {ad.tagline && (
                            <p className="truncate text-xs text-(--text-muted)">{ad.tagline}</p>
                          )}
                        </div>
                      </div>
                    </TD>
                    <TD className="whitespace-nowrap text-(--text-muted)">
                      {creatorName(ad.createdBy)}
                      {ad.createdBy.studioName && (
                        <span className="block text-xs text-(--text-subtle)">{ad.createdBy.studioName}</span>
                      )}
                    </TD>
                    <TD className="hidden whitespace-nowrap text-(--text-muted) md:table-cell">
                      {new Date(ad.createdAt).toLocaleDateString()}
                    </TD>
                    <TD className="whitespace-nowrap">
                      <Badge tone={AD_STATUS_TONE[ad.status]}>{ad.status}</Badge>
                      {ad.status === "REJECTED" && ad.rejectionReason && (
                        <span className="mt-0.5 block max-w-40 truncate text-xs text-(--text-subtle)" title={ad.rejectionReason}>
                          {ad.rejectionReason}
                        </span>
                      )}
                    </TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {ad.status === "PENDING" && (
                          <>
                            <Button variant="secondary" size="sm" disabled={busy} onClick={() => setRejecting(ad)}>
                              Reject
                            </Button>
                            <Button size="sm" disabled={busy} onClick={() => void approve(ad)}>
                              {busy ? "…" : "Approve"}
                            </Button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleting(ad)}
                          aria-label={`Delete ad: ${ad.title}`}
                          title="Delete"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-(--text-muted) transition-colors hover:bg-(--danger-soft) hover:text-(--danger)"
                        >
                          <TrashIcon width={15} height={15} />
                        </button>
                      </div>
                    </TD>
                  </TR>
                );
              })}
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
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
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

      <Modal open={rejecting !== null} onClose={() => setRejecting(null)} title="Reject ad">
        {rejecting && (
          <RejectForm ad={rejecting} onConfirm={confirmReject} onCancel={() => setRejecting(null)} />
        )}
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete ad">
        {deleting && (
          <DeleteConfirm ad={deleting} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
        )}
      </Modal>

      <AdFormModal open={creating} onClose={() => setCreating(false)} onCreated={() => void load()} />
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="animate-pulse space-y-3 p-5">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-11 rounded-md bg-(--surface-2)" />
      ))}
    </div>
  );
}

function RejectForm({
  ad,
  onConfirm,
  onCancel,
}: {
  ad: Ad;
  onConfirm: (ad: Ad, reason: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setError(null);
    setBusy(true);
    try {
      await onConfirm(ad, reason.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reject ad.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-(--text-secondary)">
        Reject <span className="font-semibold text-(--text)">{ad.title}</span>? The artist will be
        notified.
      </p>
      <label className="block space-y-1 text-sm">
        <span className="text-(--text-muted)">Reason (optional)</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="e.g. Inappropriate imagery"
          className="w-full resize-none rounded-md border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text) outline-none transition-colors focus:border-(--accent)"
        />
      </label>
      {error && (
        <p role="alert" className="rounded-md border border-(--danger) bg-(--danger-soft) px-3 py-2 text-sm text-(--danger)">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" variant="danger" disabled={busy} onClick={() => void run()}>
          {busy ? "Rejecting…" : "Reject"}
        </Button>
      </div>
    </div>
  );
}

function DeleteConfirm({
  ad,
  onConfirm,
  onCancel,
}: {
  ad: Ad;
  onConfirm: (ad: Ad) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setError(null);
    setBusy(true);
    try {
      await onConfirm(ad);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete ad.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-(--text-secondary)">
        Delete <span className="font-semibold text-(--text)">{ad.title}</span>? This removes it from
        all lists and cannot be undone.
      </p>
      {error && (
        <p role="alert" className="rounded-md border border-(--danger) bg-(--danger-soft) px-3 py-2 text-sm text-(--danger)">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" variant="danger" disabled={busy} onClick={() => void run()}>
          {busy ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </div>
  );
}
