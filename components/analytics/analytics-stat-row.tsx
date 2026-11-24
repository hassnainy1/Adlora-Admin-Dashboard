"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AnalyticsIcon, UsersIcon, StarIcon, MemoriesIcon } from "@/components/icons";
import { useAnalyticsQuery } from "@/components/analytics/use-analytics-query";
import { analyticsApi } from "@/lib/analytics";

function formatChange(percent: number | null): string | undefined {
  if (percent == null) return undefined;
  return `${percent >= 0 ? "+" : ""}${percent.toFixed(1)}%`;
}

export function AnalyticsStatRow({ days }: { days: number }) {
  const dau = useAnalyticsQuery(analyticsApi.dau, days);
  const rating = useAnalyticsQuery(analyticsApi.reviewRating, days);
  const memories = useAnalyticsQuery(analyticsApi.memoryActivity, days);

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {dau.error ? (
        <StatCardError label="Avg DAU" message={dau.error} onRetry={dau.retry} />
      ) : dau.data ? (
        <StatCard
          label="Avg DAU"
          value={dau.data.avgDau.count.toLocaleString()}
          change={formatChange(dau.data.avgDau.changePercent)}
          icon={UsersIcon}
          accent="blue"
          trend={dau.data.avgDau.trend.map((t) => t.count)}
        />
      ) : (
        <StatCardSkeleton />
      )}

      {dau.error ? (
        <StatCardError label="Stickiness" message={dau.error} onRetry={dau.retry} />
      ) : dau.data ? (
        <StatCard
          label="Stickiness (DAU/MAU)"
          value={`${dau.data.stickiness.percent.toFixed(0)}%`}
          change={formatChange(dau.data.stickiness.changePercent)}
          icon={AnalyticsIcon}
          accent="emerald"
        />
      ) : (
        <StatCardSkeleton />
      )}

      {rating.error ? (
        <StatCardError label="Avg Review Rating" message={rating.error} onRetry={rating.retry} />
      ) : rating.data ? (
        <StatCard
          label="Avg Review Rating"
          value={rating.data.avgReviewRating.value != null ? rating.data.avgReviewRating.value.toFixed(1) : "—"}
          change={formatChange(rating.data.avgReviewRating.changePercent)}
          icon={StarIcon}
          accent="amber"
        />
      ) : (
        <StatCardSkeleton />
      )}

      {memories.error ? (
        <StatCardError label="Memories" message={memories.error} onRetry={memories.retry} />
      ) : memories.data ? (
        <StatCard
          label={`Memories (${days}d)`}
          value={memories.data.memories.count.toLocaleString()}
          change={formatChange(memories.data.memories.changePercent)}
          icon={MemoriesIcon}
          accent="violet"
          trend={memories.data.memories.trend.map((t) => t.count)}
        />
      ) : (
        <StatCardSkeleton />
      )}
    </section>
  );
}

function StatCardSkeleton() {
  return (
    <div className="glass rounded-(--radius) p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-9 w-9 rounded-(--radius)" />
      </div>
      <Skeleton className="mt-3 h-7 w-24 rounded" />
      <Skeleton className="mt-2 h-3 w-16 rounded" />
    </div>
  );
}

function StatCardError({ label, message, onRetry }: { label: string; message: string; onRetry: () => void }) {
  return (
    <div className="glass rounded-(--radius) p-5">
      <span className="text-xs font-medium tracking-wide text-(--text-muted) uppercase">{label}</span>
      <p className="mt-3 text-xs text-(--danger)">{message}</p>
      <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
