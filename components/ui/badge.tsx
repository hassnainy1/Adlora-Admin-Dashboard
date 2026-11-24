import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

/** Shared tone → bg/text classes, reused wherever else a tone needs coloring (e.g. icon avatars). */
export const BADGE_TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-(--surface-2) text-(--text-secondary)",
  success: "bg-(--success-soft) text-(--success)",
  warning: "bg-(--warning-soft) text-(--warning)",
  danger: "bg-(--danger-soft) text-(--danger)",
  info: "bg-(--info-soft) text-(--info)",
  accent: "bg-(--accent-soft) text-(--accent)",
};

const toneStyles = BADGE_TONE_CLASSES;

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
