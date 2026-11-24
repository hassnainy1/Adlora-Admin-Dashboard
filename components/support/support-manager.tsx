"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table";
import { TicketsIcon, SearchIcon } from "@/components/icons";
import { ApiError } from "@/lib/api";
import {
  supportApi,
  STATUS_LABELS,
  TICKET_STATUSES,
  type SupportTicket,
  type TicketStatus,
} from "@/lib/support";
import { usersApi, fullName, type AdminUser } from "@/lib/users";
import { useRefreshOn } from "@/lib/data-refresh";
import { UserCell } from "@/components/support/support-shared";
import { TicketDetailModal } from "@/components/support/ticket-detail-modal";

const statusTone: Record<TicketStatus, BadgeTone> = {
  PENDING: "warning",
  IN_PROGRESS: "info",
  RESOLVED: "success",
};

const FILTERS = ["ALL", ...TICKET_STATUSES] as const;
type Filter = (typeof FILTERS)[number];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SupportManager() {
  const [items, setItems] = useState<SupportTicket[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<SupportTicket | null>(null);
  const [viewing, setViewing] = useState<SupportTicket | null>(null);

  // Tickets only carry userId — each load's rows are enriched with individual
  // user lookups, cached by id since the same user can file multiple tickets.
  const userCacheRef = useRef<Map<number, AdminUser>>(new Map());
  const [userCache, setUserCache] = useState<Map<number, AdminUser>>(new Map());
  const [pendingUserIds, setPendingUserIds] = useState<Set<number>>(new Set());

  const enrichUsers = useCallback(async (tickets: SupportTicket[]) => {
    const missingIds = new Set<number>();
    for (const t of tickets) {
      if (!userCacheRef.current.has(t.userId)) missingIds.add(t.userId);
    }
    if (missingIds.size === 0) return;

    setPendingUserIds((prev) => new Set([...prev, ...missingIds]));

    const results = await Promise.allSettled(
      [...missingIds].map((id) => usersApi.get(id).then((u) => [id, u] as const)),
    );
    for (const res of results) {
      if (res.status === "fulfilled") userCacheRef.current.set(res.value[0], res.value[1]);
    }
    setUserCache(new Map(userCacheRef.current));
    setPendingUserIds((prev) => {
      const next = new Set(prev);
      missingIds.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const load = useCallback(async () => {
    try {
      const list = await supportApi.list(filter === "ALL" ? undefined : filter);
      setItems([...list].sort((a, b) => b.id - a.id));
      setLoadError(null);
      void enrichUsers(list);
    } catch (err) {
      setItems([]);
      setLoadError(err instanceof ApiError ? err.message : "Failed to load tickets.");
    }
  }, [filter, enrichUsers]);

  useEffect(() => {
    // setState only runs after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useRefreshOn("support", load);

  async function changeStatus(ticket: SupportTicket, status: TicketStatus) {
    if (status === ticket.status) return;
    setSavingId(ticket.id);
    setRowError(null);
    // Optimistic update, reverted on failure.
    setItems((prev) =>
      (prev ?? []).map((t) => (t.id === ticket.id ? { ...t, status } : t)),
    );
    try {
      const updated = await supportApi.updateStatus(ticket.id, status);
      setItems((prev) => (prev ?? []).map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setItems((prev) =>
        (prev ?? []).map((t) => (t.id === ticket.id ? { ...t, status: ticket.status } : t)),
      );
      setRowError(err instanceof ApiError ? err.message : "Failed to update status.");
    } finally {
      setSavingId(null);
    }
  }

  async function confirmDelete(ticket: SupportTicket) {
    await supportApi.remove(ticket.id);
    setItems((prev) => (prev ?? []).filter((t) => t.id !== ticket.id));
    setViewing((v) => (v && v.id === ticket.id ? null : v));
    setToDelete(null);
  }

  const loading = items === null;
  const term = q.trim().toLowerCase();
  const filtered = (items ?? []).filter((t) => {
    const userName = userCache.get(t.userId);
    const matchesTerm =
      !term ||
      t.title.toLowerCase().includes(term) ||
      t.description.toLowerCase().includes(term) ||
      (userName ? fullName(userName).toLowerCase().includes(term) : false);
    return matchesTerm;
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Support"
        subtitle={
          loading
            ? "Loading…"
            : `${filtered.length} ${filtered.length === 1 ? "ticket" : "tickets"}`
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                "h-8 rounded-md px-3 text-sm font-medium transition-colors " +
                (filter === f
                  ? "bg-(--accent) text-(--accent-foreground)"
                  : "border border-(--border) bg-(--surface) text-(--text-secondary) hover:bg-(--surface-2)")
              }
            >
              {f === "ALL" ? "All" : STATUS_LABELS[f]}
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
            placeholder="Search subject, description, user…"
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
            icon={TicketsIcon}
            title="No tickets found"
            description={term || filter !== "ALL" ? "Try a different search or filter." : "No support tickets yet."}
          />
        ) : (
          <Table>
            <THead>
              <TH>Subject</TH>
              <TH className="hidden sm:table-cell">User</TH>
              <TH className="hidden lg:table-cell">Created</TH>
              <TH>Status</TH>
            </THead>
            <TBody>
              {filtered.map((t) => (
                <TR key={t.id} onClick={() => setViewing(t)}>
                  <TD className="max-w-md">
                    <p className="font-medium text-(--text)">{t.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-(--text-muted)">
                      {t.description}
                    </p>
                  </TD>
                  <TD className="hidden sm:table-cell whitespace-nowrap text-(--text-muted)">
                    <UserCell user={userCache.get(t.userId) ?? null} fallbackId={t.userId} loading={pendingUserIds.has(t.userId)} />
                  </TD>
                  <TD className="hidden lg:table-cell whitespace-nowrap text-(--text-muted)">
                    {formatDate(t.createdAt)}
                  </TD>
                  <TD>
                    <Badge tone={statusTone[t.status]}>{STATUS_LABELS[t.status]}</Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <TicketDetailModal
        ticket={viewing}
        user={viewing ? (userCache.get(viewing.userId) ?? null) : null}
        userLoading={viewing ? pendingUserIds.has(viewing.userId) : false}
        statusTone={statusTone}
        savingStatus={viewing ? savingId === viewing.id : false}
        onClose={() => setViewing(null)}
        onStatusChange={(ticket, status) => void changeStatus(ticket, status)}
        onDelete={(ticket) => setToDelete(ticket)}
      />

      <Modal open={toDelete !== null} onClose={() => setToDelete(null)} title="Delete ticket">
        {toDelete && (
          <DeleteConfirm
            ticket={toDelete}
            onConfirm={confirmDelete}
            onCancel={() => setToDelete(null)}
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

function DeleteConfirm({
  ticket,
  onConfirm,
  onCancel,
}: {
  ticket: SupportTicket;
  onConfirm: (t: SupportTicket) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function run() {
    setError(null);
    setDeleting(true);
    try {
      await onConfirm(ticket);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-(--text-secondary)">
        Delete the ticket{" "}
        <span className="font-semibold text-(--text)">{ticket.title}</span>? This
        action cannot be undone.
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
        <Button type="button" variant="danger" disabled={deleting} onClick={() => void run()}>
          {deleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </div>
  );
}
