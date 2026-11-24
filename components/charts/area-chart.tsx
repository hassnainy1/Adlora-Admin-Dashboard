import type { Point } from "@/components/charts/bar-chart";

/**
 * Responsive area + line chart (SVG, no dependencies). The line draws in via
 * CSS keyframes (pathLength normalized to 1, so it always completes); the
 * fill and points fade in after it.
 */
export function AreaChart({
  data,
  stroke = "var(--accent)",
  formatValue = (v) => v.toLocaleString(),
}: {
  data: Point[];
  stroke?: string;
  formatValue?: (v: number) => string;
}) {
  // A single point leaves no interval to space it across (data.length - 1 === 0),
  // which is what produced the NaN cx/cy warning below — bail out before that.
  if (data.length < 2) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-(--text-subtle)">
        Not enough data yet
      </div>
    );
  }

  const W = 600;
  const H = 200;
  const padX = 8;
  const padTop = 16;
  const padBottom = 28;

  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const span = max - min || 1;
  const step = (W - padX * 2) / (data.length - 1);

  // Cap how many x-axis labels render — with 30/90 points, labelling every
  // one crams them into illegible overlapping text. Always keep the last
  // point labelled so the axis doesn't look truncated.
  const MAX_LABELS = 8;
  const labelStride = Math.max(1, Math.ceil(data.length / MAX_LABELS));
  const showLabel = (i: number) => i % labelStride === 0 || i === data.length - 1;

  const pts = data.map((d, i) => {
    const x = padX + i * step;
    const y = padTop + (1 - (d.value - min) / span) * (H - padTop - padBottom);
    return [x, y] as const;
  });

  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `${padX},${H - padBottom} ${line} ${W - padX},${H - padBottom}`;
  const gid = `area-${stroke.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="200"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* horizontal gridlines */}
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={padX}
          x2={W - padX}
          y1={padTop + f * (H - padTop - padBottom)}
          y2={padTop + f * (H - padTop - padBottom)}
          stroke="var(--border-subtle)"
          strokeWidth="1"
        />
      ))}

      <polygon
        points={area}
        fill={`url(#${gid})`}
        className="chart-area-fill"
      />
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength={0.5}
        className="chart-line"
      />

      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle
            cx={x}
            cy={y}
            r="3"
            fill="var(--surface)"
            stroke={stroke}
            strokeWidth="2"
            className="chart-dot"
            style={{ animationDelay: `${0.5 + i * 0.06}s` }}
          />
          {showLabel(i) && (
            <text
              x={x}
              y={H - 8}
              textAnchor="middle"
              className="fill-(--text-subtle) text-[11px]"
            >
              {data[i].label}
            </text>
          )}
        </g>
      ))}

      {/* peak label */}
      <text
        x={
          pts[
            data.indexOf(data.reduce((a, b) => (a.value > b.value ? a : b)))
          ][0]
        }
        y={padTop - 4}
        textAnchor="middle"
        className="fill-(--text-muted) text-[11px] font-medium"
      >
        {formatValue(max)}
      </text>
    </svg>
  );
}
