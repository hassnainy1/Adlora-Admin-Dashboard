"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BADGE_TONE_CLASSES } from "@/components/ui/badge";
import { BellIcon, CloseIcon } from "@/components/icons";
import { notificationVisual, resolveNotificationLink, timeAgo, type AdminNotification } from "@/lib/notifications";
import { cn } from "@/lib/cn";

export function NotificationsPanel({
  notifications,
  loading,
  error,
  onClose,
  onReadAll,
  onOpenItem,
  onRetry,
}: {
  notifications: AdminNotification[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onReadAll: () => void;
  onOpenItem: (n: AdminNotification) => void;
  onRetry: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      role="menu"
      aria-label="Notifications"
      initial={{ opacity: 0, scale: 0.96, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="absolute right-0 top-full z-30 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-xl border border-(--border) bg-(--surface) shadow-2xl"
    >
      <div className="flex items-center justify-between gap-3 border-b border-(--border) bg-(--surface-2)/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-(--accent-soft) text-(--accent)">
            <BellIcon width={14} height={14} />
          </span>
          <p className="text-sm font-semibold text-(--text)">Notifications</p>
          {unreadCount > 0 && (
            <span className="rounded-full bg-(--accent) px-1.5 py-0.5 text-[10px] font-semibold text-(--accent-foreground)">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onReadAll}
              className="text-xs font-medium text-(--accent) transition-colors hover:text-(--accent-hover) hover:underline"
            >
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="flex h-6 w-6 items-center justify-center rounded-md text-(--text-subtle) transition-colors hover:bg-(--surface-2) hover:text-(--text)"
          >
            <CloseIcon width={13} height={13} />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingRows />
      ) : error ? (
        <div className="space-y-2 px-4 py-6 text-center">
          <p className="text-sm text-(--danger)">{error}</p>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-(--surface-2) text-(--text-subtle)">
            <BellIcon width={20} height={20} />
          </span>
          <p className="text-sm font-medium text-(--text)">You&apos;re all caught up</p>
          <p className="text-xs text-(--text-muted)">Nothing new to review right now.</p>
        </div>
      ) : (
        <ul className="max-h-96 divide-y divide-(--border-subtle) overflow-y-auto">
          {notifications.map((n, i) => {
            const { icon: TypeIcon, tone } = notificationVisual(n);
            const href = resolveNotificationLink(n)?.href ?? "/notifications";
            return (
              <motion.li
                key={n.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: Math.min(i, 6) * 0.03 }}
              >
                <Link
                  href={href}
                  onClick={() => onOpenItem(n)}
                  className={cn(
                    "group relative flex gap-3 border-l-2 px-4 py-3 transition-colors hover:bg-(--surface-2)",
                    n.isRead ? "border-l-transparent" : "border-l-(--accent) bg-(--accent-soft)/30",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-150 group-hover:scale-105",
                      BADGE_TONE_CLASSES[tone],
                    )}
                  >
                    <TypeIcon width={16} height={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm",
                        n.isRead ? "text-(--text-secondary)" : "font-semibold text-(--text)",
                      )}
                    >
                      {n.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-(--text-muted)">{n.body}</p>
                    <p className="mt-1 text-[11px] text-(--text-subtle)">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-(--accent)" />
                  )}
                </Link>
              </motion.li>
            );
          })}
        </ul>
      )}

      <Link
        href="/notifications"
        onClick={onClose}
        className="flex items-center justify-center gap-1.5 border-t border-(--border) bg-(--surface-2)/40 px-4 py-2.5 text-sm font-medium text-(--accent) transition-colors hover:bg-(--surface-2)"
      >
        View all notifications
        <span className="transition-transform group-hover:translate-x-0.5">›</span>
      </Link>
    </motion.div>
  );
}

function LoadingRows() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-(--surface-2)" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-3/4 rounded bg-(--surface-2)" />
            <div className="h-2.5 w-1/2 rounded bg-(--surface-2)" />
          </div>
        </div>
      ))}
    </div>
  );
}
