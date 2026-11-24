"use client";

import type { ReactNode } from "react";
import { CloseIcon } from "@/components/icons";

/** Floating action bar shown while rows are selected. */
export function BulkActionBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children: ReactNode;
}) {
  if (count === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
      <div className="glass pointer-events-auto flex items-center gap-3 rounded-full py-2 pr-2 pl-4 shadow-lg">
        <span className="text-sm font-medium text-(--text)">
          {count} selected
        </span>
        <span className="h-5 w-px bg-(--border)" />
        <div className="flex items-center gap-2">{children}</div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="flex h-7 w-7 items-center justify-center rounded-full text-(--text-muted) transition-colors hover:bg-(--surface-2) hover:text-(--text)"
        >
          <CloseIcon width={16} height={16} />
        </button>
      </div>
    </div>
  );
}
