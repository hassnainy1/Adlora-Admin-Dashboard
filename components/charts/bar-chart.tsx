import { cn } from "@/lib/cn";

/** `value2` is optional — when present on any point, a second bar renders alongside the first. */
export type Point = { label: string; value: number; value2?: number };

/**
 * Dependency-free responsive bar chart (CSS heights). Purely presentational —
 * pass already-aggregated data from the server. Bars grow in via CSS keyframes
 * (fill-mode: both), so they always land at full height.
 */
export function BarChart({
  data,
  barClass = "bg-(--accent)",
  barClass2 = "bg-(--c-blue)",
  formatValue = (v) => v.toLocaleString(),
}: {
  data: Point[];
  barClass?: string;
  barClass2?: string;
  formatValue?: (v: number) => string;
}) {
  const hasSecondSeries = data.some((d) => d.value2 != null);
  const max = Math.max(...data.map((d) => Math.max(d.value, d.value2 ?? 0)), 1);

  // With 30/90 points, labelling (and gapping) every single bar forces columns
  // below their content's intrinsic width, which overflows the flex row right
  // out of the card. Thin the x-axis labels the same way AreaChart does, and
  // tighten the gap so the row always fits its container instead of spilling.
  const MAX_LABELS = 10;
  const labelStride = Math.max(1, Math.ceil(data.length / MAX_LABELS));
  const showLabel = (i: number) => i % labelStride === 0 || i === data.length - 1;
  const gapClass = data.length > 14 ? "gap-0.5 sm:gap-1" : "gap-2 sm:gap-3";

  return (
    // Columns must stretch (no items-end on this row) so the flex-1 bar track gets real height.
    // min-w-0 lets each column shrink below its label's intrinsic width instead of overflowing.
    <div className={cn("flex h-48", gapClass)}>
      {data.map((d, i) => (
        <div key={i} className={cn("group flex min-w-0 flex-1 flex-col items-center gap-2")}>
          <div className="flex w-full min-w-0 flex-1 items-end gap-0.5">
            <div
              className={cn(
                "chart-bar relative w-full rounded-t-md transition-opacity group-hover:opacity-80",
                barClass,
              )}
              style={{
                height: `${Math.max((d.value / max) * 100, 4)}%`,
                animationDelay: `${i * 50}ms`,
              }}
            >
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-medium whitespace-nowrap text-(--text-muted) opacity-0 transition-opacity group-hover:opacity-100">
                {formatValue(d.value)}
              </span>
            </div>
            {hasSecondSeries && (
              <div
                className={cn(
                  "chart-bar relative w-full rounded-t-md transition-opacity group-hover:opacity-80",
                  barClass2,
                )}
                style={{
                  height: `${Math.max(((d.value2 ?? 0) / max) * 100, 4)}%`,
                  animationDelay: `${i * 50 + 25}ms`,
                }}
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-medium whitespace-nowrap text-(--text-muted) opacity-0 transition-opacity group-hover:opacity-100">
                  {formatValue(d.value2 ?? 0)}
                </span>
              </div>
            )}
          </div>
          <span className="w-full truncate text-center text-xs text-(--text-subtle)">
            {showLabel(i) ? d.label : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
