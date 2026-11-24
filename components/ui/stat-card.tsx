import type { Icon } from "@/components/icons";
import { Sparkline } from "@/components/charts/sparkline";
import { cn } from "@/lib/cn";

export type Accent = "violet" | "blue" | "emerald" | "amber" | "rose" | "cyan";

const accentMap: Record<Accent, { icon: string; bar: string; stroke: string }> = {
  violet: { icon: "bg-(--c-violet-soft) text-(--c-violet)", bar: "bg-(--c-violet)", stroke: "var(--c-violet)" },
  blue: { icon: "bg-(--c-blue-soft) text-(--c-blue)", bar: "bg-(--c-blue)", stroke: "var(--c-blue)" },
  emerald: { icon: "bg-(--c-emerald-soft) text-(--c-emerald)", bar: "bg-(--c-emerald)", stroke: "var(--c-emerald)" },
  amber: { icon: "bg-(--c-amber-soft) text-(--c-amber)", bar: "bg-(--c-amber)", stroke: "var(--c-amber)" },
  rose: { icon: "bg-(--c-rose-soft) text-(--c-rose)", bar: "bg-(--c-rose)", stroke: "var(--c-rose)" },
  cyan: { icon: "bg-(--c-cyan-soft) text-(--c-cyan)", bar: "bg-(--c-cyan)", stroke: "var(--c-cyan)" },
};

export type Stat = {
  label: string;
  value: string;
  change?: string;
  icon: Icon;
  accent: Accent;
  /** Optional mini trend rendered as a sparkline. */
  trend?: number[];
  /** For metrics where a decrease is the good outcome (e.g. Open Reports). */
  invert?: boolean;
};

export function StatCard({ label, value, change, icon: IconCmp, accent, trend, invert = false }: Stat) {
  const negative = change?.startsWith("-");
  const good = invert ? negative : !negative;
  const c = accentMap[accent];

  return (
    <div className="glass group relative overflow-hidden rounded-(--radius) p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-18px_rgb(20_20_40/0.35)]">
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100",
          c.bar,
        )}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-(--text-muted) uppercase">
          {label}
        </span>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-(--radius) transition-transform duration-200 group-hover:scale-110",
            c.icon,
          )}
        >
          <IconCmp width={17} height={17} />
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-(--text)">
        {value}
      </div>
      <div className="mt-1 flex items-center gap-1 text-xs font-medium">
        {change && (
          <>
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded px-1 py-0.5",
                good
                  ? "bg-(--success-soft) text-(--success)"
                  : "bg-(--danger-soft) text-(--danger)",
              )}
            >
              {negative ? "▾" : "▴"} {change}
            </span>
            <span className="text-(--text-subtle)">vs last week</span>
          </>
        )}
      </div>
      {trend && trend.length > 1 && (
        <div className="mt-3 -mx-1">
          <Sparkline data={trend} stroke={c.stroke} height={36} />
        </div>
      )}
    </div>
  );
}
