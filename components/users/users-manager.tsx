"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table";
import { Toggle } from "@/components/ui/toggle";
import { UsersIcon, SearchIcon } from "@/components/icons";
import { ApiError, mediaUrl } from "@/lib/api";
import type { Pagination } from "@/lib/api";
import {
  usersApi,
  fullName,
  type AdminUser,
  type UserStatus,
  type UserAction,
} from "@/lib/users";
import { useRefreshOn } from "@/lib/data-refresh";
import { cn } from "@/lib/cn";

const LIMIT = 20;

const statusTone: Record<UserStatus, BadgeTone> = {
  active: "success",
  pending: "warning",
  suspended: "danger",
  deleted: "neutral",
};

/** A dedicated "Deleted" tab so deleted accounts don't clutter the default view mixed in with active ones. */
const STATUS_TABS: { value: UserStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "pending", label: "Pending" },
  { value: "deleted", label: "Deleted" },
];

function initials(u: AdminUser) {
  return (
    `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase() || "?"
  );
}

/** suspend is punitive — confirm with a reason before firing. */
const REASON_REQUIRED: UserAction[] = ["suspend"];

/** Plain end users only — artist applications live on the dedicated Artists screen. */
export function UsersManager() {
  const [items, setItems] = useState<AdminUser[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<{ user: AdminUser; action: UserAction; label: string } | null>(null);
  const [reason, setReason] = useState("");
  const [exporting, setExporting] = useState(false);

  // Debounce the search box into the actual filter used for fetching.
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
      role: "USER" as const,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
    }),
    [page, search, statusFilter],
  );

  const load = useCallback(async () => {
    try {
      const res = await usersApi.listPaged(filters);
      // The API has no "exclude deleted" filter, so an unfiltered "All" request
      // still returns deleted accounts — they belong only under the Deleted tab.
      setItems(statusFilter === "all" ? res.data.filter((u) => u.status !== "deleted") : res.data);
      setPagination(res.pagination ?? null);
      setLoadError(null);
    } catch (err) {
      setItems([]);
      setLoadError(err instanceof ApiError ? err.message : "Failed to load users.");
    }
  }, [filters, statusFilter]);

  useEffect(() => {
    // setState runs only after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useRefreshOn("users", load);

  function updateResult(updated: AdminUser) {
    setItems((prev) => (prev ?? []).map((u) => (u.id === updated.id ? updated : u)));
  }

  async function runAction(user: AdminUser, action: UserAction, actionReason?: string) {
    setBusyId(user.id);
    setRowError(null);
    try {
      const updated = await usersApi.action(user.id, action, actionReason || undefined);
      updateResult(updated);
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Failed to update user.");
    } finally {
      setBusyId(null);
    }
  }

  function requestAction(user: AdminUser, action: UserAction, label: string) {
    if (REASON_REQUIRED.includes(action)) {
      setReason("");
      setConfirming({ user, action, label });
    } else {
      void runAction(user, action);
    }
  }

  async function confirmAction() {
    if (!confirming) return;
    await runAction(confirming.user, confirming.action, reason.trim());
    setConfirming(null);
  }

  async function toggleVerified(user: AdminUser) {
    await runAction(user, user.isVerified ? "unverify" : "verify");
  }

  async function exportCsv() {
    setExporting(true);
    try {
      await usersApi.exportCsv(filters, "users.csv");
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Failed to export CSV.");
    } finally {
      setExporting(false);
    }
  }

  const loading = items === null;
  const hasFilters = statusFilter !== "all";

  function clearFilters() {
    setStatusFilter("all");
    setPage(1);
  }

  function setStatusFilterAndReset(next: UserStatus | "all") {
    setStatusFilter(next);
    setPage(1);
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Users"
        subtitle={
          loading
            ? "Loading…"
            : pagination
              ? `${pagination.total} ${pagination.total === 1 ? "user" : "users"}`
              : undefined
        }
        actions={
          <Button variant="secondary" size="sm" disabled={exporting} onClick={() => void exportCsv()}>
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto rounded-md border border-(--border) bg-(--surface) p-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setStatusFilterAndReset(t.value)}
              className={cn(
                "shrink-0 rounded px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === t.value
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
            placeholder="Search by name or email…"
            className="h-9 w-full rounded-md border border-(--border) bg-(--surface) pl-9 pr-3 text-sm text-(--text) placeholder:text-(--text-subtle) outline-none transition-colors focus:border-(--accent)"
          />
        </div>
      </div>

      {hasFilters && (
        <div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      )}

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

      <Card className="overflow-visible">
        {!loading && items && items.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No users found"
            description={search || hasFilters ? "Try a different search or filter." : "No users yet."}
          />
        ) : (
          <Table>
            <THead>
              <TH>User</TH>
              <TH className="hidden sm:table-cell">Status</TH>
              <TH className="hidden sm:table-cell">Identity verified</TH>
              <TH className="hidden lg:table-cell">Joined</TH>
              <TH className="text-right">Actions</TH>
            </THead>
            <TBody>
              {loading ? (
                <SkeletonRows />
              ) : (
                (items ?? []).map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    busy={busyId === u.id}
                    onAction={(action, label) => requestAction(u, action, label)}
                    onToggleVerified={() => void toggleVerified(u)}
                  />
                ))
              )}
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
            <Button variant="secondary" size="sm" disabled={pagination.page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal open={confirming !== null} onClose={() => setConfirming(null)} title={confirming ? `${confirming.label}?` : ""}>
        {confirming && (
          <div className="space-y-4">
            <p className="text-sm text-(--text-secondary)">
              {confirming.label} {fullName(confirming.user)}
              {confirming.user.email ? ` (${confirming.user.email})` : ""}?
            </p>
            <label className="block text-sm font-medium text-(--text-secondary)">
              Reason <span className="font-normal text-(--text-subtle)">(optional)</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Why is this action being taken?"
                className="mt-1.5 w-full rounded-md border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text) placeholder:text-(--text-subtle) outline-none transition-colors focus:border-(--accent)"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirming(null)}>
                Cancel
              </Button>
              <Button
                variant={confirming.action === "suspend" || confirming.action === "reject" ? "danger" : "primary"}
                size="sm"
                disabled={busyId === confirming.user.id}
                onClick={() => void confirmAction()}
              >
                {busyId === confirming.user.id ? "…" : confirming.label}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function UserRow({
  user,
  busy,
  onAction,
  onToggleVerified,
}: {
  user: AdminUser;
  busy: boolean;
  onAction: (action: UserAction, label: string) => void;
  onToggleVerified: () => void;
}) {
  return (
    <TR>
      <TD>
        <Link href={`/users/${user.id}`} className="group/row flex items-center gap-2 sm:gap-3">
          {mediaUrl(user.profileImageUrl) ? (
            <img
              src={mediaUrl(user.profileImageUrl)!}
              alt=""
              className="h-7 w-7 shrink-0 rounded-full object-cover sm:h-8 sm:w-8"
            />
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--accent-soft) text-xs font-semibold text-(--accent) sm:h-8 sm:w-8">
              {initials(user)}
            </span>
          )}
          <div className="min-w-0 max-w-[9rem] sm:max-w-none">
            <div className="truncate font-medium text-(--text) group-hover/row:text-(--accent)">
              {fullName(user)}
            </div>
            <div className="truncate text-xs text-(--text-subtle)">{user.email}</div>
          </div>
        </Link>
        <div className="mt-1.5 flex items-center gap-1.5 sm:hidden">
          <Badge tone={statusTone[user.status] ?? "neutral"}>{user.status}</Badge>
          <Toggle size="sm" checked={user.isVerified} onChange={onToggleVerified} label="Identity verified" />
          <span className="text-[11px] text-(--text-subtle)">Verified</span>
        </div>
      </TD>
      <TD className="hidden sm:table-cell">
        <Badge tone={statusTone[user.status] ?? "neutral"}>{user.status}</Badge>
      </TD>
      <TD className="hidden sm:table-cell">
        <Toggle checked={user.isVerified} onChange={onToggleVerified} label="Identity verified" />
      </TD>
      <TD className="hidden lg:table-cell whitespace-nowrap text-(--text-muted)">
        {new Date(user.createdAt).toLocaleDateString()}
      </TD>
      <TD className="text-right">
        {user.status === "active" ? (
          <Button
            size="sm"
            variant="danger"
            disabled={busy}
            onClick={() => onAction("suspend", "Suspend")}
            className="h-7 px-2 text-[11px] sm:h-8 sm:px-3 sm:text-xs"
          >
            {busy ? "…" : "Suspend"}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => onAction("activate", "Activate")}
            className="h-7 px-2 text-[11px] sm:h-8 sm:px-3 sm:text-xs"
          >
            {busy ? "…" : "Activate"}
          </Button>
        )}
      </TD>
    </TR>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <TR key={i}>
          <TD>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-(--surface-2)" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-32 animate-pulse rounded bg-(--surface-2)" />
                <div className="h-3 w-40 animate-pulse rounded bg-(--surface-2)" />
              </div>
            </div>
          </TD>
          <TD className="hidden sm:table-cell"><div className="h-4 w-16 animate-pulse rounded bg-(--surface-2)" /></TD>
          <TD className="hidden sm:table-cell"><div className="h-6 w-11 animate-pulse rounded-full bg-(--surface-2)" /></TD>
          <TD className="hidden lg:table-cell"><div className="h-4 w-20 animate-pulse rounded bg-(--surface-2)" /></TD>
          <TD className="text-right"><div className="ml-auto h-8 w-20 animate-pulse rounded-md bg-(--surface-2)" /></TD>
        </TR>
      ))}
    </>
  );
}
