"use client";

import { cn } from "@/lib/cn";

export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label?: string;
}) {
  const on = checked || indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "flex h-4.5 w-4.5 items-center justify-center rounded border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-(--accent)/40",
        on
          ? "border-(--accent) bg-(--accent) text-(--accent-foreground)"
          : "border-(--border) bg-(--surface) hover:border-(--accent)",
      )}
    >
      {indeterminate ? (
        <span className="h-0.5 w-2.5 rounded-full bg-current" />
      ) : checked ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : null}
    </button>
  );
}
