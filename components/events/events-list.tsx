"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table";
import { EventsIcon, SearchIcon, StarIcon } from "@/components/icons";
import { ApiError, mediaUrl } from "@/lib/api";
import type { Pagination } from "@/lib/api";
import {
  eventsApi,
  creatorName,
  eventLocation,
  EVENT_TYPES,
  EVENT_STATUSES,
  APPROVAL_STATUSES,
  APPROVAL_STATUS_TONE,
  EVENT_STATUS_TONE,
  type Event,
  type EventType,
  type EventStatus,
  type ApprovalStatus,
} from "@/lib/events";
import { useRefreshOn } from "@/lib/data-refresh";
import { EventFormModal } from "@/components/events/event-form-modal";
import { EventDetailModal } from "@/components/events/event-detail-modal";
import { EventRejectModal } from "@/components/events/event-reject-modal";

const LIMIT = 20;

interface Filters {
  type: EventType | "";
  status: EventStatus | "";
  approvalStatus: ApprovalStatus | "";
  city: string;
  state: string;
  country: string;
  startDateFrom: string;
  startDateTo: string;
  isFeatured: boolean;
}

const EMPTY_FILTERS: Filters = {
  type: "",
  status: "",
  approvalStatus: "",
  city: "",
  state: "",
  country: "",
  startDateFrom: "",
  startDateTo: "",
  isFeatured: false,
};

export function EventsList({ createOpen, onCreateClose }: { createOpen: boolean; onCreateClose: () => void }) {
  const [events, setEvents] = useState<Event[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const [viewingId, setViewingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Event | null>(null);
  const [rejecting, setRejecting] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState<Event | null>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  const params = useMemo(
    () => ({
      page,
      limit: LIMIT,
      search: search || undefined,
      type: filters.type || undefined,
      status: filters.status || undefined,
      approvalStatus: filters.approvalStatus || undefined,
      city: filters.city || undefined,
      state: filters.state || undefined,
      country: filters.country || undefined,
      startDateFrom: filters.startDateFrom || undefined,
      startDateTo: filters.startDateTo || undefined,
      isFeatured: filters.isFeatured || undefined,
    }),
    [page, search, filters],
  );

  const load = useCallback(async () => {
    try {
      const res = await eventsApi.list(params);
      setEvents(res.data);
      setPagination(res.pagination ?? null);
      setLoadError(null);
    } catch (err) {
      setEvents([]);
      setLoadError(err instanceof ApiError ? err.message : "Failed to load events.");
    }
  }, [params]);

  useEffect(() => {
    // setState only runs after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useRefreshOn("events", load);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function patchEvent(updated: Event) {
    setEvents((prev) => (prev ? prev.map((e) => (e.id === updated.id ? updated : e)) : prev));
  }

  async function approve(event: Event) {
    setBusyId(event.id);
    setRowError(null);
    try {
      const updated = await eventsApi.approve(event.id);
      patchEvent(updated);
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Failed to approve event.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject(event: Event, reason: string) {
    setBusyId(event.id);
    try {
      const updated = await eventsApi.reject(event.id, reason);
      patchEvent(updated);
      setRejecting(null);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleFeatured(event: Event) {
    setBusyId(event.id);
    setRowError(null);
    try {
      const updated = await eventsApi.setFeatured(event.id, !event.isFeatured);
      patchEvent(updated);
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Failed to update event.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete(event: Event) {
    setBusyId(event.id);
    try {
      await eventsApi.remove(event.id);
      setDeleting(null);
      void load();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Failed to delete event.");
    } finally {
      setBusyId(null);
    }
  }

  const loading = events === null;
  const inputClass =
    "h-9 rounded-md border border-(--border) bg-(--surface) px-2.5 text-sm text-(--text) outline-none transition-colors focus:border-(--accent)";

  return (
    <div className="space-y-6">
      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative w-full max-w-xs">
            <SearchIcon width={16} height={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-(--text-subtle)" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search events…"
              className={`${inputClass} w-full pl-9`}
            />
          </div>

          <select value={filters.type} onChange={(e) => updateFilter("type", e.target.value as EventType | "")} className={inputClass}>
            <option value="">All types</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select value={filters.status} onChange={(e) => updateFilter("status", e.target.value as EventStatus | "")} className={inputClass}>
            <option value="">All statuses</option>
            {EVENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filters.approvalStatus}
            onChange={(e) => updateFilter("approvalStatus", e.target.value as ApprovalStatus | "")}
            className={inputClass}
          >
            <option value="">All approval</option>
            {APPROVAL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <label className="flex h-9 items-center gap-1.5 rounded-md border border-(--border) bg-(--surface) px-2.5 text-sm text-(--text-secondary)">
            <input type="checkbox" checked={filters.isFeatured} onChange={(e) => updateFilter("isFeatured", e.target.checked)} />
            Featured only
          </label>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <input type="text" placeholder="City" value={filters.city} onChange={(e) => updateFilter("city", e.target.value)} className={`${inputClass} w-32`} />
          <input type="text" placeholder="State" value={filters.state} onChange={(e) => updateFilter("state", e.target.value)} className={`${inputClass} w-32`} />
          <input type="text" placeholder="Country" value={filters.country} onChange={(e) => updateFilter("country", e.target.value)} className={`${inputClass} w-32`} />
          <label className="flex items-center gap-1.5 text-xs text-(--text-muted)">
            From
            <input type="date" value={filters.startDateFrom} onChange={(e) => updateFilter("startDateFrom", e.target.value)} className={inputClass} />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-(--text-muted)">
            To
            <input type="date" value={filters.startDateTo} onChange={(e) => updateFilter("startDateTo", e.target.value)} className={inputClass} />
          </label>
          {(filters.type || filters.status || filters.approvalStatus || filters.city || filters.state || filters.country || filters.startDateFrom || filters.startDateTo || filters.isFeatured) && (
            <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear filters
            </Button>
          )}
        </div>
      </Card>

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
        ) : (events ?? []).length === 0 ? (
          <EmptyState icon={EventsIcon} title="No events found" description={search ? "Try a different search." : "Nothing matches these filters."} />
        ) : (
          <Table>
            <THead>
              <TH>Event</TH>
              <TH className="hidden sm:table-cell">Type</TH>
              <TH className="hidden lg:table-cell">Location</TH>
              <TH className="hidden md:table-cell">Starts</TH>
              <TH>Status</TH>
              <TH className="hidden sm:table-cell">Approval</TH>
            </THead>
            <TBody>
              {(events ?? []).map((event) => (
                <TR key={event.id} onClick={() => setViewingId(event.id)}>
                  <TD className="max-w-56 sm:max-w-xs">
                    <div className="flex items-center gap-3">
                      {event.coverImage ? (
                        <img src={mediaUrl(event.coverImage) ?? undefined} alt={event.title} className="h-10 w-10 shrink-0 rounded-md border border-(--border) object-cover sm:h-11 sm:w-11" />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-(--surface-2) text-(--text-subtle) sm:h-11 sm:w-11">
                          <EventsIcon width={18} height={18} />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="flex items-center gap-1 truncate font-medium text-(--text)">
                          {event.isFeatured && <StarIcon width={12} height={12} fill="currentColor" className="shrink-0 text-(--warning)" />}
                          <span className="truncate">{event.title}</span>
                        </span>
                        <span className="block truncate text-xs text-(--text-muted)">by {creatorName(event.createdBy)}</span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:hidden">
                          <span className="text-[11px] text-(--text-muted)">{event.type}</span>
                          <span className="text-[11px] text-(--text-subtle)">·</span>
                          <span className="text-[11px] text-(--text-muted)">{new Date(event.startDate).toLocaleDateString()}</span>
                          <Badge tone={APPROVAL_STATUS_TONE[event.approvalStatus]}>{event.approvalStatus}</Badge>
                        </span>
                      </span>
                    </div>
                  </TD>
                  <TD className="hidden whitespace-nowrap text-(--text-muted) sm:table-cell">{event.type}</TD>
                  <TD className="hidden whitespace-nowrap text-(--text-muted) lg:table-cell">{eventLocation(event)}</TD>
                  <TD className="hidden whitespace-nowrap text-(--text-muted) md:table-cell">{new Date(event.startDate).toLocaleDateString()}</TD>
                  <TD className="whitespace-nowrap">
                    <Badge tone={EVENT_STATUS_TONE[event.status]}>{event.status}</Badge>
                  </TD>
                  <TD className="hidden whitespace-nowrap sm:table-cell">
                    <Badge tone={APPROVAL_STATUS_TONE[event.approvalStatus]}>{event.approvalStatus}</Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-(--text-muted)">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
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

      <EventDetailModal
        eventId={viewingId}
        onClose={() => setViewingId(null)}
        onApprove={(e) => void approve(e)}
        onReject={(e) => setRejecting(e)}
        onEdit={(e) => {
          setViewingId(null);
          setEditing(e);
        }}
        onDelete={(e) => {
          setViewingId(null);
          setDeleting(e);
        }}
        onToggleFeatured={(e) => void toggleFeatured(e)}
        busy={viewingId !== null && busyId === viewingId}
      />

      <EventRejectModal event={rejecting} onClose={() => setRejecting(null)} onConfirm={confirmReject} />

      <EventFormModal open={createOpen} onClose={onCreateClose} onSaved={() => void load()} />
      <EventFormModal open={editing !== null} event={editing} onClose={() => setEditing(null)} onSaved={() => void load()} />

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete event">
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-(--text-secondary)">
              Delete <span className="font-semibold text-(--text)">{deleting.title}</span>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" disabled={busyId === deleting.id} onClick={() => void confirmDelete(deleting)}>
                {busyId === deleting.id ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
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
