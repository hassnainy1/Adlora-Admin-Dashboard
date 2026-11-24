import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
  glass = false,
}: {
  children: ReactNode;
  className?: string;
  glass?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-(--radius)",
        glass ? "glass" : "border border-(--border) bg-(--surface)",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-(--border-subtle) px-5 py-4">
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold text-(--text)">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-(--text-muted)">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
