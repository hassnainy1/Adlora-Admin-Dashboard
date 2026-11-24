"use client";

import { motion } from "framer-motion";

export type Segment = { label: string; value: number; color: string };

/**
 * Donut chart with legend (SVG, no dependencies). `color` accepts any CSS
 * color, e.g. "var(--c-violet)". Segments draw in on mount.
 */
export function DonutChart({
  data,
  centerLabel,
}: {
  data: Segment[];
  centerLabel?: string;
}) {
  const total = data.reduce((sum, s) => sum + s.value, 0) || 1;
  const R = 60;
  const C = 2 * Math.PI * R;

  // Precompute each segment's arc length and its start offset (no render mutation).
  const segments = data.map((s) => ({ ...s, len: (s.value / total) * C }));
  const offsets = segments.reduce<number[]>((acc, s, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + segments[i - 1].len);
    return acc;
  }, []);

  return (
    // @container: the row/column switch below reacts to THIS component's own
    // rendered width (via @sm:), not the viewport. A viewport breakpoint
    // (sm:) is wrong here — this chart routinely sits in a narrow grid cell
    // or embedded preview pane that's nowhere near as wide as the window, so
    // a viewport-based switch can flip to the row layout while there's
    // nowhere near enough actual space, squeezing the legend to nothing.
    <div className="@container">
      <div className="flex min-w-0 flex-col items-center gap-6 @sm:flex-row @sm:gap-8">
        <svg viewBox="0 0 160 160" width="160" height="160" className="shrink-0 -rotate-90">
          <circle cx="80" cy="80" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="18" />
          {segments.map((s, i) => (
            <motion.circle
              key={s.label}
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="18"
              strokeDashoffset={-offsets[i]}
              strokeLinecap="butt"
              initial={{ strokeDasharray: `0 ${C}` }}
              animate={{ strokeDasharray: `${s.len} ${C - s.len}` }}
              transition={{ duration: 0.8, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            />
          ))}
          {centerLabel && (
            <motion.text
              x="80"
              y="80"
              textAnchor="middle"
              dominantBaseline="central"
              className="rotate-90 fill-(--text) text-[20px] font-semibold"
              transform="rotate(90 80 80)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              {centerLabel}
            </motion.text>
          )}
        </svg>

        <ul className="w-full min-w-0 space-y-2">
          {data.map((s, i) => (
            <motion.li
              key={s.label}
              className="flex min-w-0 items-center gap-2.5 text-sm"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.3 + i * 0.08 }}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="flex-1 truncate text-(--text-secondary)">{s.label}</span>
              <span className="tabular-nums text-(--text-muted)">
                {Math.round((s.value / total) * 100)}%
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
