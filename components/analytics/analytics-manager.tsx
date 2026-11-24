"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { AnalyticsStatRow } from "@/components/analytics/analytics-stat-row";
import { AnalyticsLineCharts } from "@/components/analytics/analytics-line-charts";
import { AnalyticsDonutRow } from "@/components/analytics/analytics-donut-row";
import { AnalyticsUploadsRow } from "@/components/analytics/analytics-uploads-row";
import { cn } from "@/lib/cn";

const DAY_OPTIONS = [7, 30, 90] as const;

export function AnalyticsManager() {
  const [days, setDays] = useState<number>(7);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Analytics"
        subtitle={`Platform metrics for the last ${days} days`}
        actions={
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
        }
      />

      <AnalyticsStatRow days={days} />
      <AnalyticsLineCharts days={days} />
      <AnalyticsDonutRow days={days} />
      <AnalyticsUploadsRow days={days} />
    </div>
  );
}
