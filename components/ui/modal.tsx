"use client";

import { useEffect, type ReactNode } from "react";
import { CloseIcon } from "@/components/icons";

const sizeClass = {
  md: "max-w-md",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: keyof typeof sizeClass;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${sizeClass[size]} max-h-[85vh] overflow-y-auto rounded-xl border border-(--border) bg-(--surface) p-5 shadow-2xl`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-(--text)">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-md text-(--text-subtle) transition-colors hover:bg-(--surface-2) hover:text-(--text)"
          >
            <CloseIcon width={16} height={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
