"use client";

import { useCallback, useState } from "react";
import { CloseIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

export type ToastTone = "success" | "danger";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const toneClasses: Record<ToastTone, string> = {
  success: "border-(--success) bg-(--success-soft) text-(--success)",
  danger: "border-(--danger) bg-(--danger-soft) text-(--danger)",
};

let nextId = 1;

/** Lightweight toast queue — no external dependency, matches this project's minimal-deps preference. */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, tone }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  return { toasts, notify, dismiss };
}

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={cn(
            "pointer-events-auto flex items-start gap-2 rounded-md border px-3.5 py-2.5 text-sm shadow-lg",
            toneClasses[t.tone],
          )}
        >
          <span className="flex-1">{t.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
          >
            <CloseIcon width={14} height={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
