"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { useToasts, ToastViewport } from "@/components/ui/toast";
import { ReportsIcon } from "@/components/icons";
import { ApiError } from "@/lib/api";
import type { Pagination } from "@/lib/api";
import { reportsApi, type AdminReport, type ReportStatus } from "@/lib/reports";
import { invalidate } from "@/lib/data-refresh";
import { statusTone, typeTone, STATUS_LABELS, STATUS_OPTIONS, TYPE_LABELS } from "@/components/reports/report-status";
import { ReporterCell } from "@/components/reports/report-shared";
import { ReportDetailModal } from "@/components/reports/report-detail-modal";

const LIMIT = 20;

export function ReportsManager() {
  const [items, setItems] = useState<AdminReport[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "">("");
  const [viewing, setViewing] = useState<AdminReport | null>(null);

  const { toasts, notify, dismiss } = useToasts();

  const filters = useMemo(
    () => ({ page, limit: LIMIT, status: statusFilter || undefined }),
    [page, statusFilter],
  );

  const load = useCallback(async () => {
    try {
      const res = await reportsApi.list(filters);
      setItems([...res.data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setPagination(res.pagination ?? null);
      setLoadError(null);
    } catch (err) {
      setItems([]);
      setLoadError(err instanceof ApiError ? err.message : "Failed to load reports.");
    }
  }, [filters]);

  useEffect(() => {
    // setState runs only after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function setStatusFilterAndReset(next: ReportStatus | "") {
    setStatusFilter(next);
    setPage(1);
  }

  function handleUpdated(updated: AdminReport) {
    setItems((prev) => (prev ? prev.map((r) => (r.id === updated.id ? updated : r)) : prev));
    setViewing((v) => (v && v.id === updated.id ? updated : v));
    invalidate("reports");
  }

  const loading = items === null;
  const visible = items;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Reports"
        subtitle={
          loading
            ? "Loading…"
            : pagination
              ? `${pagination.total} ${pagination.total === 1 ? "report" : "reports"}`
              : undefined
        }
      />

      <Card className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
        <StatusTab label="All" active={statusFilter === ""} onClick={() => setStatusFilterAndReset("")} />
        {STATUS_OPTIONS.map((s) => (
          <StatusTab
            key={s}
            label={STATUS_LABELS[s]}
            active={statusFilter === s}
            onClick={() => setStatusFilterAndReset(s)}
          />
        ))}
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
        {!loading && visible && visible.length === 0 ? (
          <EmptyState icon={ReportsIcon} title="No reports" description="Try a different filter." />
        ) : (
          <Table>
            <THead>
              <TH>Reporter</TH>
              <TH>Type</TH>
              <TH className="hidden sm:table-cell">Reason</TH>
              <TH>Status</TH>
              <TH className="hidden lg:table-cell">Created</TH>
            </THead>
            <TBody>
              {loading
                ? Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} />)
                : (visible ?? []).map((r) => (
                    <TR key={r.id} onClick={() => setViewing(r)}>
                      <TD className="max-w-48">
                        <ReporterCell report={r} />
                      </TD>
                      <TD>
                        <Badge tone={typeTone[r.reportableType]}>{TYPE_LABELS[r.reportableType]}</Badge>
                      </TD>
                      <TD className="hidden max-w-xs sm:table-cell text-(--text-secondary)">
                        <span className="block truncate" title={r.reason}>
                          {r.reason}
                        </span>
                      </TD>
                      <TD>
                        <Badge tone={statusTone[r.status]}>{STATUS_LABELS[r.status]}</Badge>
                      </TD>
                      <TD className="hidden lg:table-cell text-(--text-muted) tabular-nums whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString()}
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
            <Button variant="secondary" size="sm" disabled={pagination.page <= 1} onClick={() => setPage((p) => p - 1)}>
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

      <ReportDetailModal report={viewing} onClose={() => setViewing(null)} onUpdated={handleUpdated} notify={notify} />

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function StatusTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Button variant={active ? "primary" : "secondary"} size="sm" onClick={onClick}>
      {label}
    </Button>
  );
}

function SkeletonRow() {
  return (
    <TR>
      <TD><Skeleton className="h-4 w-full max-w-24 rounded" /></TD>
      <TD><Skeleton className="h-4 w-full max-w-24 rounded" /></TD>
      <TD><Skeleton className="h-4 w-full max-w-24 rounded" /></TD>
      <TD className="hidden sm:table-cell"><Skeleton className="h-4 w-full max-w-24 rounded" /></TD>
      <TD><Skeleton className="h-4 w-full max-w-24 rounded" /></TD>
      <TD className="hidden lg:table-cell"><Skeleton className="h-4 w-full max-w-24 rounded" /></TD>
    </TR>
  );
}
