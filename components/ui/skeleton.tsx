import { cn } from "@/lib/cn";

/**
 * A single pulsing placeholder block. Compose these for any loading skeleton
 * (text bars, avatars, card covers) instead of hand-writing
 * `animate-pulse ... bg-(--surface-2)` at each call site — pass shape/size via
 * `className` (e.g. `"h-8 w-8 rounded-full"`, `"h-4 w-24 rounded"`).
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-(--surface-2)", className)} />;
}
