"use client";

import { DonutChart, type Segment } from "@/components/charts/donut-chart";
import { ChartCard } from "@/components/analytics/chart-card";
import { useAnalyticsQuery } from "@/components/analytics/use-analytics-query";
import { analyticsApi, type SharePart } from "@/lib/analytics";

const MEMORY_TYPE_COLORS = ["var(--c-blue)", "var(--c-violet)", "var(--c-rose)"];
const PRIVACY_COLORS = ["var(--c-cyan)", "var(--c-blue)", "var(--c-violet)", "var(--c-amber)"];

function toSegments(parts: SharePart[], colors: string[]): Segment[] {
  return parts.map((p, i) => ({ label: p.label, value: p.count, color: colors[i % colors.length] }));
}

function totalLabel(parts: SharePart[]): string {
  return parts.reduce((sum, p) => sum + p.count, 0).toLocaleString();
}

export function AnalyticsDonutRow({ days }: { days: number }) {
  const memoriesByType = useAnalyticsQuery(analyticsApi.memoriesByType, days);
  const privacyLevels = useAnalyticsQuery(analyticsApi.privacyLevels, days);

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard
        title="Memories by Type"
        subtitle="Share of new memories"
        data={memoriesByType.data}
        error={memoriesByType.error}
        onRetry={memoriesByType.retry}
      >
        {(data) => <DonutChart data={toSegments(data, MEMORY_TYPE_COLORS)} centerLabel={totalLabel(data)} />}
      </ChartCard>

      <ChartCard
        title="Privacy Levels"
        subtitle="How users share memories"
        data={privacyLevels.data}
        error={privacyLevels.error}
        onRetry={privacyLevels.retry}
      >
        {(data) => <DonutChart data={toSegments(data, PRIVACY_COLORS)} centerLabel={totalLabel(data)} />}
      </ChartCard>
    </section>
  );
}
