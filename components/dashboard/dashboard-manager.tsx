"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard, type Stat } from "@/components/ui/stat-card";
import { ActivityFeed } from "@/components/activity-feed";
import { AreaChart } from "@/components/charts/area-chart";
import { DonutChart, type Segment } from "@/components/charts/donut-chart";
import { ArtistsIcon, ReportsIcon, ScanIcon, MemoriesIcon } from "@/components/icons";
import { bucketDateLabel, bucketPoints, bucketSizeForDays } from "@/components/analytics/bucket-trend";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import {
  dashboardApi,
  type DashboardStats,
  type ScanActivityPoint,
  type ReportStatusSegment,
  type RecentActivityItem,
  type NeedsAttention,
} from "@/lib/dashboard";

const STATUS_COLOR: Record<ReportStatusSegment["status"], string> = {
  OPEN: "var(--c-rose)",
  REVIEWING: "var(--c-amber)",
  RESOLVED: "var(--c-emerald)",
};

const STATUS_LABEL: Record<ReportStatusSegment["status"], string> = {
  OPEN: "Open",
  REVIEWING: "Reviewing",
  RESOLVED: "Resolved",
};

const DAY_OPTIONS = [7, 30, 90] as const;

function formatPercentChange(changePercent: number | null): string | undefined {
  if (changePercent === null) return undefined;
  return `${changePercent < 0 ? "-" : "+"}${Math.abs(changePercent).toFixed(1)}%`;
}

function formatDeltaChange(change: number): string {
  return `${change < 0 ? "-" : "+"}${Math.abs(change)}`;
}

export function DashboardManager() {
  const [days, setDays] = useState(7);

  // --- Stats -----------------------------------------------------------
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const loadStats = useCallback(async () => {
    try {
      setStats(await dashboardApi.stats(days));
      setStatsError(null);
    } catch (err) {
      setStatsError(err instanceof ApiError ? err.message : "Failed to load stats.");
    }
  }, [days]);
  useEffect(() => {
    // setState only runs after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStats();
  }, [loadStats]);

  // --- Scan activity -----------------------------------------------------
  const [scanActivity, setScanActivity] = useState<ScanActivityPoint[] | null>(null);
  const [scanActivityError, setScanActivityError] = useState<string | null>(null);
  const loadScanActivity = useCallback(async () => {
    try {
      setScanActivity(await dashboardApi.scanActivity(days));
      setScanActivityError(null);
    } catch (err) {
      setScanActivityError(err instanceof ApiError ? err.message : "Failed to load scan activity.");
    }
  }, [days]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadScanActivity();
  }, [loadScanActivity]);

  // --- Reports by status ---------------------------------------------------
  const [reportsByStatus, setReportsByStatus] = useState<ReportStatusSegment[] | null>(null);
  const [reportsByStatusError, setReportsByStatusError] = useState<string | null>(null);
  const loadReportsByStatus = useCallback(async () => {
    try {
      setReportsByStatus(await dashboardApi.reportsByStatus());
      setReportsByStatusError(null);
    } catch (err) {
      setReportsByStatusError(err instanceof ApiError ? err.message : "Failed to load reports.");
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReportsByStatus();
  }, [loadReportsByStatus]);

  // --- Recent activity ----------------------------------------------------
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[] | null>(null);
  const [recentActivityError, setRecentActivityError] = useState<string | null>(null);
  const loadRecentActivity = useCallback(async () => {
    try {
      setRecentActivity(await dashboardApi.recentActivity(10));
      setRecentActivityError(null);
    } catch (err) {
      setRecentActivityError(err instanceof ApiError ? err.message : "Failed to load recent activity.");
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRecentActivity();
  }, [loadRecentActivity]);

  // --- Needs attention ------------------------------------------------------
  const [needsAttention, setNeedsAttention] = useState<NeedsAttention | null>(null);
  const [needsAttentionError, setNeedsAttentionError] = useState<string | null>(null);
  const loadNeedsAttention = useCallback(async () => {
    try {
      setNeedsAttention(await dashboardApi.needsAttention());
      setNeedsAttentionError(null);
    } catch (err) {
      setNeedsAttentionError(err instanceof ApiError ? err.message : "Failed to load.");
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadNeedsAttention();
  }, [loadNeedsAttention]);

  const statCards: Stat[] | null = stats
    ? [
        {
          label: "Scans Today",
          value: stats.scansToday.count.toLocaleString(),
          change: formatPercentChange(stats.scansToday.changePercent),
          icon: ScanIcon,
          accent: "amber",
        },
        {
          label: `Memories Created (${stats.memoriesCreated.periodDays}D)`,
          value: stats.memoriesCreated.count.toLocaleString(),
          change: formatPercentChange(stats.memoriesCreated.changePercent),
          icon: MemoriesIcon,
          accent: "violet",
        },
        {
          label: "Pending Artists",
          value: stats.pendingArtists.count.toLocaleString(),
          change: formatDeltaChange(stats.pendingArtists.change),
          icon: ArtistsIcon,
          accent: "cyan",
        },
        {
          label: "Open Reports",
          value: stats.openReports.count.toLocaleString(),
          change: formatDeltaChange(stats.openReports.change),
          icon: ReportsIcon,
          accent: "rose",
          invert: true,
        },
      ]
    : null;

  // One point per day is fine at 7 days, but overflows/crowds the chart at
  // 30/90 — same fix as the Analytics page's Scans chart: fold the range down
  // into a handful of summed buckets (7d daily, 30d weekly, 90d 18-day chunks).
  const scanPoints = scanActivity
    ? (() => {
        const bucketSize = bucketSizeForDays(days);
        const buckets = bucketPoints(
          scanActivity,
          bucketSize,
          (first) => ({ date: first.date, count: 0 }),
          (acc, p) => ({ ...acc, count: acc.count + p.count }),
        );
        return buckets.map((b) => ({ label: bucketDateLabel(b.date, bucketSize), value: b.count }));
      })()
    : undefined;

  const reportSegments: Segment[] | undefined = reportsByStatus?.map((s) => ({
    label: STATUS_LABEL[s.status],
    value: s.count,
    color: STATUS_COLOR[s.status],
  }));
  const reportTotal = reportsByStatus?.reduce((sum, s) => sum + s.count, 0);

  const attentionRows: { id: string; label: string; count: number; tone: BadgeTone; href: string }[] | null =
    needsAttention
      ? [
          {
            id: "artists",
            label: "Artists awaiting approval",
            count: needsAttention.artistsAwaitingApproval,
            tone: "accent",
            href: "/artists",
          },
          {
            id: "reports",
            label: "Reports to review",
            count: needsAttention.reportsToReview,
            tone: "danger",
            href: "/moderation",
          },
          {
            id: "support",
            label: "Open support tickets",
            count: needsAttention.openSupportTickets,
            tone: "warning",
            href: "/support",
          },
        ]
      : null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Dashboard"
        subtitle="Platform overview and items needing attention"
        actions={
          <>
            <div className="flex items-center gap-1 rounded-md border border-(--border) bg-(--surface) p-1">
              {DAY_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={cn(
                    "rounded px-3 py-1.5 text-xs font-medium transition-colors",
                    days === d
                      ? "bg-(--accent) text-(--accent-foreground)"
                      : "text-(--text-muted) hover:bg-(--surface-2)",
                  )}
                >
                  {d}D
                </button>
              ))}
            </div>
            <Button size="md">Export</Button>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards ? (
          statCards.map((s) => <StatCard key={s.label} {...s} />)
        ) : statsError ? (
          <SectionError className="sm:col-span-2 xl:col-span-4" message={statsError} onRetry={() => void loadStats()} />
        ) : (
          <StatCardSkeletons />
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card glass className="lg:col-span-2">
          <CardHeader
            title="Scan Activity"
            subtitle={
              bucketSizeForDays(days) === 1
                ? `Tattoo scans per day · last ${days} days`
                : `Tattoo scans, grouped · last ${days} days`
            }
          />
          <div className="p-5 pt-3">
            {scanPoints ? (
              scanPoints.length > 0 ? (
                <AreaChart data={scanPoints} stroke="var(--accent)" />
              ) : (
                <EmptyChart />
              )
            ) : scanActivityError ? (
              <SectionError message={scanActivityError} onRetry={() => void loadScanActivity()} />
            ) : (
              <ChartSkeleton />
            )}
          </div>
        </Card>
        <Card glass>
          <CardHeader title="Reports" subtitle="By status" />
          <div className="p-5">
            {reportSegments ? (
              reportSegments.length > 0 ? (
                <DonutChart data={reportSegments} centerLabel={reportTotal?.toLocaleString()} />
              ) : (
                <EmptyChart />
              )
            ) : reportsByStatusError ? (
              <SectionError message={reportsByStatusError} onRetry={() => void loadReportsByStatus()} />
            ) : (
              <ChartSkeleton />
            )}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card glass className="lg:col-span-2">
          <CardHeader title="Recent Activity" subtitle="Latest events across the platform" />
          {recentActivity ? (
            <ActivityFeed items={recentActivity} />
          ) : recentActivityError ? (
            <SectionError message={recentActivityError} onRetry={() => void loadRecentActivity()} />
          ) : (
            <ListSkeleton />
          )}
        </Card>

        <Card glass>
          <CardHeader title="Needs Attention" subtitle="Queued admin actions" />
          {attentionRows ? (
            <ul className="divide-y divide-(--border-subtle)">
              {attentionRows.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-(--surface-hover)"
                  >
                    <span className="min-w-0 truncate text-sm text-(--text-secondary)">
                      {item.label}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge tone={item.tone}>{item.count}</Badge>
                      <span className="text-(--text-subtle)">›</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : needsAttentionError ? (
            <SectionError message={needsAttentionError} onRetry={() => void loadNeedsAttention()} />
          ) : (
            <ListSkeleton rows={3} />
          )}
        </Card>
      </section>
    </div>
  );
}

function StatCardSkeletons() {
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="glass animate-pulse rounded-(--radius) p-5">
          <div className="h-3 w-24 rounded bg-(--surface-2)" />
          <div className="mt-4 h-7 w-20 rounded bg-(--surface-2)" />
          <div className="mt-3 h-3 w-16 rounded bg-(--surface-2)" />
        </div>
      ))}
    </>
  );
}

function ChartSkeleton() {
  return <div className="h-[200px] animate-pulse rounded-md bg-(--surface-2)" />;
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3 p-5">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-9 rounded-md bg-(--surface-2)" />
      ))}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[200px] items-center justify-center text-sm text-(--text-muted)">
      No data yet.
    </div>
  );
}

function SectionError({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry: () => void;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger) ${className ?? ""}`}
    >
      <span>{message}</span>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
