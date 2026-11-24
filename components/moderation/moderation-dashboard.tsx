"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table";
import { ModerationIcon } from "@/components/icons";
import { ApiError } from "@/lib/api";
import { timeAgo } from "@/lib/notifications";
import { cn } from "@/lib/cn";
import {
  moderationDashboardApi,
  actorName,
  type ModerationDashboard,
} from "@/lib/dashboard-moderation";

function violationBadge(count: number): { tone: BadgeTone; label: string } | null {
  if (count >= 5) return { tone: "danger", label: "Auto-suspended" };
  if (count >= 3) return { tone: "warning", label: "Warned" };
  return null;
}

function actionTone(action: string): BadgeTone {
  const a = action.toUpperCase();
  if (a.includes("APPROVE") || a.includes("ACTIVATE") || a.includes("UNBLOCK")) return "success";
  if (a.includes("FLAG") || a.includes("WARN")) return "warning";
  if (a.includes("REMOVE") || a.includes("REJECT") || a.includes("SUSPEND") || a.includes("BLOCK") || a.includes("DELETE")) return "danger";
  return "neutral";
}

function offenderInitials(v: { firstName: string; lastName: string }) {
  return `${v.firstName?.[0] ?? ""}${v.lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

export function ModerationDashboardWidget() {
  const [data, setData] = useState<ModerationDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await moderationDashboardApi.get(20));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load moderation data.");
    }
  }, []);

  useEffect(() => {
    // setState runs only after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function exportCsv() {
    setExporting(true);
    try {
      await moderationDashboardApi.exportCsv(20, "moderation-activity.csv");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to export CSV.");
    } finally {
      setExporting(false);
    }
  }

  const loading = data === null && !error;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Moderation"
        subtitle="Moderation activity and repeat offenders"
        actions={
          <Button variant="secondary" size="sm" disabled={exporting || !data} onClick={() => void exportCsv()}>
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        }
      />

      {error && (
        <div className="flex items-center justify-between rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      )}

      <section>
        {loading ? (
          <div className="glass h-24 animate-pulse rounded-(--radius)" />
        ) : data ? (
          <div className="glass group relative flex items-center gap-4 overflow-hidden rounded-(--radius) p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-18px_rgb(20_20_40/0.35)]">
            <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-(--c-rose) transition-transform duration-200 group-hover:scale-x-100" />
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-(--radius) bg-(--c-rose-soft) text-(--c-rose) transition-transform duration-200 group-hover:scale-110">
              <ModerationIcon width={22} height={22} />
            </span>
            <div>
              <div className="text-xs font-medium tracking-wide text-(--text-muted) uppercase">
                Total moderation actions
              </div>
              <div className="mt-1 text-2xl font-semibold tracking-tight text-(--text)">
                {data.totalActions.toLocaleString()}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card glass className="lg:col-span-2">
          <CardHeader title="Recent activity" subtitle="Latest moderation actions" />
          {loading ? (
            <ListSkeleton />
          ) : data && data.recentActions.length > 0 ? (
            <ul className="divide-y divide-(--border-subtle)">
              {data.recentActions.map((a) => (
                <li key={a.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-(--text)">{actorName(a.actor)}</span>
                    <span className="shrink-0 text-xs text-(--text-subtle)">{timeAgo(a.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-(--text-secondary)">
                    <Badge tone={actionTone(a.action)} className="mr-1.5">{a.action}</Badge>
                    {a.description ?? (a.auditableId != null ? `#${a.auditableId}` : "")}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={ModerationIcon} title="No recent activity" />
          )}
        </Card>

        <Card glass className="lg:col-span-3">
          <CardHeader title="Top offenders" subtitle="Users with the most content violations" />
          {loading ? (
            <ListSkeleton />
          ) : data && data.topViolators.length > 0 ? (
            <Table>
              <THead>
                <TH>User</TH>
                <TH>Violations</TH>
                <TH>Account status</TH>
                <TH className="hidden sm:table-cell">Last violation</TH>
              </THead>
              <TBody>
                {data.topViolators.map((v) => {
                  const badge = violationBadge(v.violationCount);
                  return (
                    <TR key={v.id} className={badge?.tone === "danger" ? "bg-(--danger-soft)/40" : undefined}>
                      <TD className="font-medium text-(--text)">
                        <span className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                              badge?.tone === "danger"
                                ? "bg-(--danger-soft) text-(--danger)"
                                : badge?.tone === "warning"
                                  ? "bg-(--warning-soft) text-(--warning)"
                                  : "bg-(--surface-2) text-(--text-muted)",
                            )}
                          >
                            {offenderInitials(v)}
                          </span>
                          {`${v.firstName} ${v.lastName}`.trim() || `User #${v.id}`}
                        </span>
                      </TD>
                      <TD>
                        <span className="flex items-center gap-1.5">
                          <span className="tabular-nums">{v.violationCount}</span>
                          {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
                        </span>
                      </TD>
                      <TD className="text-(--text-muted)">{v.status}</TD>
                      <TD className="hidden sm:table-cell text-(--text-muted)">
                        {v.lastViolationAt ? new Date(v.lastViolationAt).toLocaleDateString() : "—"}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          ) : (
            <EmptyState icon={ModerationIcon} title="No repeat offenders" description="No users with content violations yet." />
          )}
        </Card>
      </section>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-5">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-9 rounded-md bg-(--surface-2)" />
      ))}
    </div>
  );
}
