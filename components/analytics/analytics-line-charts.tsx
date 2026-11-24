"use client";

import { AreaChart } from "@/components/charts/area-chart";
import type { Point } from "@/components/charts/bar-chart";
import { ChartCard } from "@/components/analytics/chart-card";
import { useAnalyticsQuery } from "@/components/analytics/use-analytics-query";
import { bucketDateLabel, bucketPoints, bucketSizeForDays } from "@/components/analytics/bucket-trend";
import { analyticsApi, type DauData, type TrendPoint } from "@/lib/analytics";

/** Scans are raw event counts — sum them per bucket. */
function toSumPoints(trend: TrendPoint[], days: number): Point[] {
  const bucketSize = bucketSizeForDays(days);
  const buckets = bucketPoints(
    trend,
    bucketSize,
    (first) => ({ date: first.date, count: 0 }),
    (acc, t) => ({ ...acc, count: acc.count + t.count }),
  );
  return buckets.map((b) => ({ label: bucketDateLabel(b.date, bucketSize), value: b.count }));
}

/** DAU is already an average-per-day metric — average it per bucket instead of summing. */
function toAveragePoints(trend: TrendPoint[], days: number): Point[] {
  const bucketSize = bucketSizeForDays(days);
  const buckets = bucketPoints(
    trend,
    bucketSize,
    (first) => ({ date: first.date, sum: 0, n: 0 }),
    (acc, t) => ({ ...acc, sum: acc.sum + t.count, n: acc.n + 1 }),
  );
  return buckets.map((b) => ({ label: bucketDateLabel(b.date, bucketSize), value: Math.round(b.sum / b.n) }));
}

export function AnalyticsLineCharts({ days }: { days: number }) {
  const scans = useAnalyticsQuery(analyticsApi.scanActivity, days);
  const dau = useAnalyticsQuery(analyticsApi.dau, days);

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard
        title="Scans"
        subtitle={bucketSizeForDays(days) === 1 ? "Tattoo scans per day" : "Tattoo scans over time"}
        data={scans.data}
        error={scans.error}
        onRetry={scans.retry}
      >
        {(data) => <AreaChart data={toSumPoints(data, days)} stroke="var(--accent)" />}
      </ChartCard>

      <ChartCard
        title="Daily Active Users"
        subtitle={`Last ${days} days`}
        data={dau.data}
        error={dau.error}
        onRetry={dau.retry}
      >
        {(data: DauData) => <AreaChart data={toAveragePoints(data.avgDau.trend, days)} stroke="var(--c-blue)" />}
      </ChartCard>
    </section>
  );
}
