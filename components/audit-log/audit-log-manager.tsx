"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table";
import { AuditIcon } from "@/components/icons";
import { ApiError } from "@/lib/api";
import type { Pagination } from "@/lib/api";
import { usersApi, fullName, type AdminUser } from "@/lib/users";
import {
  auditLogApi,
  actorName,
  targetLabel,
  AUDIT_ACTIONS,
  AUDIT_ACTION_TONE,
  AUDITABLE_TYPES,
  type AuditLogEntry,
  type AuditLogFilters,
} from "@/lib/audit-log";

const LIMIT = 20;

type Filters = Omit<AuditLogFilters, "page" | "limit">;

const EMPTY_FILTERS: Filters = {};

export function AuditLogManager() {
  const [entries, setEntries] = useState<AuditLogEntry[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [detail, setDetail] = useState<AuditLogEntry | null>(null);

  // USER-type targets carry only auditableId — each load's rows are enriched
  // with individual lookups, cached by id, so the target column can show a
  // name instead of a raw id.
  const targetUserCacheRef = useRef<Map<number, AdminUser>>(new Map());
  const [targetUserCache, setTargetUserCache] = useState<Map<number, AdminUser>>(new Map());
  const [pendingTargetUserIds, setPendingTargetUserIds] = useState<Set<number>>(new Set());

  const enrichTargetUsers = useCallback(async (rows: AuditLogEntry[]) => {
    const missingIds = new Set<number>();
    for (const e of rows) {
      if (e.auditableType === "USER" && e.auditableId != null && !targetUserCacheRef.current.has(e.auditableId)) {
        missingIds.add(e.auditableId);
      }
    }
    if (missingIds.size === 0) return;

    setPendingTargetUserIds((prev) => new Set([...prev, ...missingIds]));

    const results = await Promise.allSettled(
      [...missingIds].map((id) => usersApi.get(id).then((u) => [id, u] as const)),
    );
    for (const res of results) {
      if (res.status === "fulfilled") targetUserCacheRef.current.set(res.value[0], res.value[1]);
    }
    setTargetUserCache(new Map(targetUserCacheRef.current));
    setPendingTargetUserIds((prev) => {
      const next = new Set(prev);
      missingIds.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  useEffect(() => {
    usersApi
      .list("ADMIN")
      .then(setAdmins)
      .catch(() => setAdmins([]));
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await auditLogApi.list({ page, limit: LIMIT, ...filters });
      setEntries(res.data);
      setPagination(res.pagination ?? null);
      setLoadError(null);
      void enrichTargetUsers(res.data);
    } catch (err) {
      setEntries([]);
      setLoadError(err instanceof ApiError ? err.message : "Failed to load audit logs.");
    }
  }, [page, filters, enrichTargetUsers]);

  useEffect(() => {
    // setState only runs after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  const hasActiveFilters = Object.keys(filters).length > 0;

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }

  const adminOptions = useMemo(
    () => admins.map((a) => ({ value: String(a.id), label: fullName(a) })),
    [admins],
  );

  const loading = entries === null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Audit Logs"
        subtitle={
          loading
            ? "Loading…"
            : pagination
              ? `${pagination.total} ${pagination.total === 1 ? "entry" : "entries"}`
              : undefined
        }
      />

      <Card className="flex flex-wrap items-end gap-3 p-4">
        <FilterSelect
          label="Admin"
          value={filters.userId != null ? String(filters.userId) : ""}
          onChange={(v) => updateFilter("userId", v ? Number(v) : undefined)}
          options={adminOptions}
        />
        <FilterSelect
          label="Action"
          value={filters.action ?? ""}
          onChange={(v) => updateFilter("action", (v || undefined) as Filters["action"])}
          options={AUDIT_ACTIONS.map((a) => ({ value: a, label: a }))}
        />
        <FilterSelect
          label="Target type"
          value={filters.auditableType ?? ""}
          onChange={(v) => updateFilter("auditableType", v || undefined)}
          options={AUDITABLE_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <label className="flex flex-col gap-1 text-xs font-medium text-(--text-muted)">
          From
          <input
            type="date"
            value={filters.from ?? ""}
            onChange={(e) => updateFilter("from", e.target.value || undefined)}
            className="h-9 rounded-md border border-(--border) bg-(--surface) px-2 text-sm text-(--text)"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-(--text-muted)">
          To
          <input
            type="date"
            value={filters.to ?? ""}
            onChange={(e) => updateFilter("to", e.target.value || undefined)}
            className="h-9 rounded-md border border-(--border) bg-(--surface) px-2 text-sm text-(--text)"
          />
        </label>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </Card>

      {loadError && (
        <div className="flex items-center justify-between rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)">
          <span>{loadError}</span>
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      )}

      <Card>
        {loading ? (
          <LoadingRows />
        ) : entries && entries.length === 0 ? (
          <EmptyState
            icon={AuditIcon}
            title="No log entries found"
            description="Try a different search or filter."
          />
        ) : (
          <Table>
            <THead>
              <TH>Timestamp</TH>
              <TH>Admin</TH>
              <TH>Action</TH>
              <TH className="hidden md:table-cell">Target</TH>
              <TH className="hidden lg:table-cell">Description</TH>
            </THead>
            <TBody>
              {(entries ?? []).map((entry) => (
                <TR key={entry.id}>
                  <TD
                    className="cursor-pointer text-(--text-muted) tabular-nums"
                    onClick={() => setDetail(entry)}
                  >
                    {new Date(entry.createdAt).toLocaleString()}
                  </TD>
                  <TD className="cursor-pointer font-medium text-(--text)" onClick={() => setDetail(entry)}>
                    {actorName(entry.actor)}
                  </TD>
                  <TD className="cursor-pointer" onClick={() => setDetail(entry)}>
                    <Badge tone={AUDIT_ACTION_TONE[entry.action]}>{entry.action}</Badge>
                  </TD>
                  <TD
                    className="hidden cursor-pointer text-(--text-muted) md:table-cell"
                    onClick={() => setDetail(entry)}
                  >
                    <TargetCell
                      entry={entry}
                      targetUser={entry.auditableId != null ? (targetUserCache.get(entry.auditableId) ?? null) : null}
                      loading={entry.auditableId != null && pendingTargetUserIds.has(entry.auditableId)}
                    />
                  </TD>
                  <TD
                    className="hidden cursor-pointer text-(--text-muted) lg:table-cell"
                    onClick={() => setDetail(entry)}
                  >
                    {entry.description ?? "—"}
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

      <Modal open={detail !== null} onClose={() => setDetail(null)} title="Audit log entry" size="lg">
        {detail && (
          <AuditDetail
            entry={detail}
            targetUser={detail.auditableId != null ? (targetUserCache.get(detail.auditableId) ?? null) : null}
          />
        )}
      </Modal>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-(--text-muted)">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 min-w-36 rounded-md border border-(--border) bg-(--surface) px-2 text-sm text-(--text)"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
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

/**
 * Target cell shared by the table and the detail modal — resolves a USER
 * target to its name (fetched separately, since the log entry only carries
 * the id); non-user targets stay id-labeled.
 */
function TargetCell({
  entry,
  targetUser,
  loading = false,
}: {
  entry: Pick<AuditLogEntry, "auditableType" | "auditableId">;
  targetUser: AdminUser | null;
  loading?: boolean;
}) {
  if (entry.auditableType !== "USER") return <>{targetLabel(entry)}</>;
  if (loading && !targetUser) return <Skeleton className="h-4 w-24 rounded" />;
  return <>{targetUser ? fullName(targetUser) : targetLabel(entry)}</>;
}

function AuditDetail({ entry, targetUser }: { entry: AuditLogEntry; targetUser: AdminUser | null }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Detail label="Admin" value={actorName(entry.actor)} />
        <Detail label="Action" value={<Badge tone={AUDIT_ACTION_TONE[entry.action]}>{entry.action}</Badge>} />
        <Detail label="Target" value={<TargetCell entry={entry} targetUser={targetUser} />} />
        <Detail label="When" value={new Date(entry.createdAt).toLocaleString()} />
        <Detail label="IP address" value={entry.ipAddress ?? "—"} />
        <Detail label="User agent" value={<span className="break-all">{entry.userAgent ?? "—"}</span>} />
      </div>

      {entry.description && (
        <p className="rounded-md border border-(--border-subtle) bg-(--surface-2) px-3 py-2 text-sm text-(--text-secondary)">
          {entry.description}
        </p>
      )}

      {(entry.oldValues || entry.newValues) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ValuesBlock label="Before" values={entry.oldValues} />
          <ValuesBlock label="After" values={entry.newValues} />
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-(--text-muted)">{label}</dt>
      <dd className="mt-0.5 text-(--text)">{value}</dd>
    </div>
  );
}

function ValuesBlock({ label, values }: { label: string; values: Record<string, unknown> | null }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-(--text-muted)">{label}</p>
      <pre className="max-h-64 overflow-auto rounded-md border border-(--border-subtle) bg-(--surface-2) p-3 text-xs text-(--text-secondary)">
        {values ? JSON.stringify(values, null, 2) : "—"}
      </pre>
    </div>
  );
}
