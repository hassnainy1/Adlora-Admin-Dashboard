"use client";

import { cn } from "@/lib/cn";

export function Toggle({
  checked,
  onChange,
  label,
  size = "md",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  size?: "sm" | "md";
}) {
  const track = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const thumb = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const thumbOn = size === "sm" ? "translate-x-4" : "translate-x-5";
  const thumbOff = "translate-x-0.5";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-(--accent)/40",
        track,
        checked ? "bg-(--accent)" : "bg-(--surface-2)",
      )}
    >
      <span
        className={cn(
          "inline-block transform rounded-full bg-white shadow-sm transition-transform duration-200",
          thumb,
          checked ? thumbOn : thumbOff,
        )}
      />
    </button>
  );
}
