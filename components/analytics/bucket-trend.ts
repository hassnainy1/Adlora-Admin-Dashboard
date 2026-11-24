/**
 * Shared day-bucketing for analytics time-series widgets (Uploads bars, Scans/DAU
 * lines). At 7 days there's one bar/point per day; beyond that, one point per day
 * either overflows a bar chart's row or crowds a line chart's axis, so ranges
 * longer than a week get folded down into a handful of clean buckets instead.
 */

/** 7d range → daily; 30d → weekly buckets; 90d → 18-day buckets (~5 clean bars/points). */
export function bucketSizeForDays(days: number): number {
  if (days > 30) return 18;
  if (days > 7) return 7;
  return 1;
}

export function bucketDateLabel(date: string, bucketSize: number): string {
  return bucketSize === 1
    ? new Date(date).toLocaleDateString(undefined, { weekday: "short" })
    : new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Groups chronologically-ordered `points` into chunks of `bucketSize`, folding
 * each chunk down to one value via `seed` (called once, on the first point in
 * the chunk) + `combine` (called for every point in the chunk, including that
 * first one).
 */
export function bucketPoints<T, R>(
  points: T[],
  bucketSize: number,
  seed: (first: T) => R,
  combine: (acc: R, point: T) => R,
): R[] {
  const size = Math.max(1, bucketSize);
  const buckets: R[] = [];
  points.forEach((p, i) => {
    const idx = Math.floor(i / size);
    buckets[idx] = combine(buckets[idx] ?? seed(p), p);
  });
  return buckets;
}
