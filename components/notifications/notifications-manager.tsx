"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table";
import { BellIcon, CheckIcon, TrashIcon } from "@/components/icons";
import { ApiError } from "@/lib/api";
import {
  notificationsApi,
  resolveNotificationLink,
  timeAgo,
  NOTIFICATION_TYPE_TONE,
  type AdminNotification,
} from "@/lib/notifications";
import type { Pagination } from "@/lib/api";
import { useRefreshOn } from "@/lib/data-refresh";
import { BroadcastModal } from "@/components/notifications/broadcast-modal";

const LIMIT = 20;

export function NotificationsManager() {
  const [items, setItems] = useState<AdminNotification[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminNotification | null>(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [confirmingMarkAllRead, setConfirmingMarkAllRead] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [confirmingClearAll, setConfirmingClearAll] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await notificationsApi.list({ page, limit: LIMIT });
      setItems(res.data);
      setPagination(res.pagination ?? null);
      setLoadError(null);
    } catch (err) {
      setItems([]);
      setLoadError(err instanceof ApiError ? err.message : "Failed to load notifications.");
    }
  }, [page]);

  useEffect(() => {
    // setState only runs after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Every push adds a row here, whatever else it invalidates.
  useRefreshOn("notifications", load);

  async function markRead(n: AdminNotification) {
    if (n.isRead) return;
    setBusyId(n.id);
    setRowError(null);
    setItems((prev) => (prev ?? []).map((i) => (i.id === n.id ? { ...i, isRead: true } : i)));
    try {
      await notificationsApi.markRead(n.id);
    } catch (err) {
      void load();
      setRowError(err instanceof ApiError ? err.message : "Failed to mark as read.");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmMarkAllRead() {
    setMarkingAllRead(true);
    setRowError(null);
    try {
      await notificationsApi.markAllRead();
      setConfirmingMarkAllRead(false);
      void load();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Failed to mark all as read.");
    } finally {
      setMarkingAllRead(false);
    }
  }

  async function confirmClearAll() {
    setClearingAll(true);
    setRowError(null);
    try {
      await notificationsApi.clearAll();
      setConfirmingClearAll(false);
      setPage(1);
      void load();
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Failed to clear notifications.");
    } finally {
      setClearingAll(false);
    }
  }

  async function confirmDelete(n: AdminNotification) {
    await notificationsApi.remove(n.id);
    setToDelete(null);
    void load();
  }

  const loading = items === null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Notifications"
        subtitle={
          loading
            ? "Loading…"
            : pagination
              ? `${pagination.total} ${pagination.total === 1 ? "notification" : "notifications"}`
              : undefined
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => setBroadcastOpen(true)}>
              Send Broadcast
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!items || items.length === 0}
              onClick={() => setConfirmingMarkAllRead(true)}
            >
              <CheckIcon width={14} height={14} />
              Mark all read
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!items || items.length === 0}
              onClick={() => setConfirmingClearAll(true)}
            >
              <TrashIcon width={14} height={14} />
              Clear all
            </Button>
          </div>
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

      {rowError && (
        <p role="alert" className="rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-2 text-sm text-(--danger)">
          {rowError}
        </p>
      )}

      <Card>
        {loading ? (
          <LoadingRows />
        ) : items && items.length === 0 ? (
          <EmptyState icon={BellIcon} title="No notifications" description="Nothing addressed to you yet." />
        ) : (
          <Table>
            <THead>
              <TH>Type</TH>
              <TH>Notification</TH>
              <TH className="hidden lg:table-cell">From</TH>
              <TH className="hidden md:table-cell">Received</TH>
              <TH className="text-right">Actions</TH>
            </THead>
            <TBody>
              {(items ?? []).map((n) => (
                <TR key={n.id}>
                  <TD className="whitespace-nowrap">
                    <Badge tone={NOTIFICATION_TYPE_TONE[n.type]}>{n.type}</Badge>
                  </TD>
                  <TD className="max-w-md">
                    <NotificationBody notification={n} onNavigate={() => void markRead(n)} />
                  </TD>
                  <TD className="hidden lg:table-cell whitespace-nowrap text-(--text-muted)">
                    {n.sender ? `${n.sender.firstName} ${n.sender.lastName}` : "—"}
                  </TD>
                  <TD className="hidden md:table-cell whitespace-nowrap text-(--text-muted)">
                    {timeAgo(n.createdAt)}
                  </TD>
                  <TD className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!n.isRead && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={busyId === n.id}
                          onClick={() => void markRead(n)}
                        >
                          {busyId === n.id ? "…" : "Mark as read"}
                        </Button>
                      )}
                      <button
                        type="button"
                        onClick={() => setToDelete(n)}
                        aria-label={`Delete notification: ${n.title}`}
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

      <Modal open={toDelete !== null} onClose={() => setToDelete(null)} title="Delete notification">
        {toDelete && (
          <DeleteConfirm
            notification={toDelete}
            onConfirm={confirmDelete}
            onCancel={() => setToDelete(null)}
          />
        )}
      </Modal>

      <Modal open={confirmingMarkAllRead} onClose={() => setConfirmingMarkAllRead(false)} title="Mark all as read?">
        <div className="space-y-4">
          <p className="text-sm text-(--text-secondary)">This marks all of your notifications as read.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setConfirmingMarkAllRead(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" disabled={markingAllRead} onClick={() => void confirmMarkAllRead()}>
              {markingAllRead ? "Marking…" : "Mark all read"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={confirmingClearAll} onClose={() => setConfirmingClearAll(false)} title="Clear all notifications?">
        <div className="space-y-4">
          <p className="text-sm text-(--text-secondary)">
            This permanently deletes all of your notifications. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setConfirmingClearAll(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" disabled={clearingAll} onClick={() => void confirmClearAll()}>
              {clearingAll ? "Clearing…" : "Clear all"}
            </Button>
          </div>
        </div>
      </Modal>

      <BroadcastModal open={broadcastOpen} onClose={() => setBroadcastOpen(false)} />
    </div>
  );
}

function NotificationBody({
  notification: n,
  onNavigate,
}: {
  notification: AdminNotification;
  onNavigate: () => void;
}) {
  const link = resolveNotificationLink(n);

  const content = (
    <div className="flex items-start gap-2">
      {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-(--accent)" />}
      <div className="min-w-0">
        <p
          className={
            n.isRead
              ? "text-(--text) group-hover:text-(--accent)"
              : "font-semibold text-(--text) group-hover:text-(--accent)"
          }
        >
          {n.title}
        </p>
        <p title={n.body} className="mt-0.5 line-clamp-1 text-xs text-(--text-muted)">
          {n.body}
        </p>
      </div>
    </div>
  );

  if (!link) return content;

  return (
    <Link href={link.href} onClick={onNavigate} className="group block">
      {content}
    </Link>
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
  notification,
  onConfirm,
  onCancel,
}: {
  notification: AdminNotification;
  onConfirm: (n: AdminNotification) => Promise<void>;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function run() {
    setError(null);
    setDeleting(true);
    try {
      await onConfirm(notification);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-(--text-secondary)">
        Delete the notification{" "}
        <span className="font-semibold text-(--text)">{notification.title}</span>? This
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
