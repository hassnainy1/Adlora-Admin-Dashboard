/**
 * Tiny inline trend line (SVG). Scales to its container width and draws in
 * via CSS keyframes (pathLength normalized to 1, so the draw always completes).
 * `stroke` accepts any CSS color (use a token, e.g. "var(--c-blue)").
 */
export function Sparkline({
  data,
  stroke = "var(--accent)",
  height = 36,
}: {
  data: number[];
  stroke?: string;
  height?: number;
}) {
  if (data.length < 2) return null;

  const W = 100;
  const H = 100;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const step = W / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = H - ((v - min) / span) * (H - 12) - 6;
    return [x, y] as const;
  });

  const line = points.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `0,${H} ${line} ${W},${H}`;
  const gid = `spark-${stroke.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
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
    </svg>
  );
}
