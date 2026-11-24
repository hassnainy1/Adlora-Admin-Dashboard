"use client";

import { BarChart, type Point } from "@/components/charts/bar-chart";
import { DonutChart, type Segment } from "@/components/charts/donut-chart";
import { ChartCard } from "@/components/analytics/chart-card";
import { useAnalyticsQuery } from "@/components/analytics/use-analytics-query";
import { bucketDateLabel, bucketPoints, bucketSizeForDays } from "@/components/analytics/bucket-trend";
import { analyticsApi, type SharePart, type UploadsPoint } from "@/lib/analytics";

const STYLE_COLORS = ["var(--c-violet)", "var(--c-blue)", "var(--c-emerald)", "var(--c-amber)", "var(--c-rose)"];

// Module-scope so the reference is stable across renders — an inline arrow
// passed straight to useAnalyticsQuery would refetch every render.
function fetchPopularStyles(days: number) {
  return analyticsApi.popularStyles(days, 5);
}

function toUploadPoints(points: UploadsPoint[], days: number): Point[] {
  const bucketSize = bucketSizeForDays(days);
  const buckets = bucketPoints(
    points,
    bucketSize,
    (first) => ({ date: first.date, tattoos: 0, memories: 0 }),
    (acc, p) => ({ ...acc, tattoos: acc.tattoos + p.tattoos, memories: acc.memories + p.memories }),
  );
  return buckets.map((b) => ({ label: bucketDateLabel(b.date, bucketSize), value: b.tattoos, value2: b.memories }));
}

function toStyleSegments(parts: SharePart[]): Segment[] {
  return parts.map((p, i) => ({ label: p.label, value: p.count, color: STYLE_COLORS[i % STYLE_COLORS.length] }));
}

export function AnalyticsUploadsRow({ days }: { days: number }) {
  const uploads = useAnalyticsQuery(analyticsApi.uploadsActivity, days);
  const styles = useAnalyticsQuery(fetchPopularStyles, days);

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard
        title="Uploads"
        subtitle={bucketSizeForDays(days) === 1 ? "Tattoos & memories per day" : "Tattoos & memories over time"}
        data={uploads.data}
        error={uploads.error}
        onRetry={uploads.retry}
      >
        {(data) => (
          <>
            <BarChart data={toUploadPoints(data, days)} barClass="bg-(--c-violet)" barClass2="bg-(--c-blue)" />
            <div className="mt-3 flex items-center gap-4 text-xs text-(--text-muted)">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-(--c-violet)" /> Tattoos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-(--c-blue)" /> Memories
              </span>
            </div>
          </>
        )}
      </ChartCard>

      <ChartCard
        title="Popular Styles"
        subtitle="Share of uploads"
        data={styles.data}
        error={styles.error}
        onRetry={styles.retry}
      >
        {(data) => <DonutChart data={toStyleSegments(data)} centerLabel="Top 5" />}
      </ChartCard>
    </section>
  );
}
