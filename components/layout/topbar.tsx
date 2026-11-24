"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BellIcon, LogoutIcon, MenuIcon, UserIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationsPanel } from "@/components/layout/notifications-panel";
import { logout } from "@/lib/auth";
import { findActiveNavItem } from "@/lib/nav";
import { ApiError } from "@/lib/api";
import { notificationsApi, type AdminNotification } from "@/lib/notifications";
import { useUnreadCount } from "@/lib/use-unread-count";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { count: unreadCount, refresh: refreshUnreadCount } = useUnreadCount();

  const [notifOpen, setNotifOpen] = useState(false);
  const [items, setItems] = useState<AdminNotification[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const pageTitle = findActiveNavItem(pathname)?.label ?? "";

  function onSignOut() {
    logout();
    router.replace("/login");
  }

  function loadDropdown() {
    setLoadError(null);
    notificationsApi
      .list({ limit: 10 })
      .then((r) => setItems(r.data))
      .catch((err) => {
        setItems([]);
        setLoadError(err instanceof ApiError ? err.message : "Failed to load notifications.");
      });
  }

  function toggleNotif() {
    setNotifOpen((prev) => {
      const next = !prev;
      if (next) loadDropdown();
      return next;
    });
  }

  async function markRead(n: AdminNotification) {
    if (n.isRead) return;
    setItems((prev) => (prev ?? []).map((i) => (i.id === n.id ? { ...i, isRead: true } : i)));
    refreshUnreadCount();
    try {
      await notificationsApi.markRead(n.id);
    } catch {
      // Non-critical: the full list page is the source of truth on next load.
    }
  }

  async function markAllRead() {
    setItems((prev) => (prev ?? []).map((i) => ({ ...i, isRead: true })));
    refreshUnreadCount();
    try {
      await notificationsApi.markAllRead();
    } catch {
      // Non-critical: the full list page is the source of truth on next load.
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-(--topbar-height) shrink-0 items-center gap-3 border-b border-(--glass-border) bg-(--glass-bg) px-4 backdrop-blur-xl backdrop-saturate-150 lg:px-6">
      {/* Mobile menu toggle */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className="-ml-1 flex h-9 w-9 items-center justify-center rounded-md text-(--text-secondary) transition-colors hover:bg-(--surface-2) lg:hidden"
      >
        <MenuIcon />
      </button>

      {pageTitle && (
        <h1 className="hidden truncate text-sm font-semibold text-(--text) lg:block">
          {pageTitle}
        </h1>
      )}

      <div className="relative ml-auto flex items-center gap-1">
        <ThemeToggle />
        <button
          type="button"
          onClick={toggleNotif}
          aria-label="Notifications"
          aria-expanded={notifOpen}
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-(--text-secondary) transition-colors hover:bg-(--surface-2)"
        >
          <BellIcon width={18} height={18} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-(--danger) ring-2 ring-(--surface)" />
          )}
        </button>
        {notifOpen && (
          <NotificationsPanel
            notifications={items ?? []}
            loading={items === null && !loadError}
            error={loadError}
            onClose={() => setNotifOpen(false)}
            onReadAll={() => void markAllRead()}
            onOpenItem={(n) => {
              void markRead(n);
              setNotifOpen(false);
            }}
            onRetry={loadDropdown}
          />
        )}
        <Link
          href="/profile"
          aria-label="Profile"
          title="Profile"
          className="flex h-9 w-9 items-center justify-center rounded-md text-(--text-secondary) transition-colors hover:bg-(--surface-2) hover:text-(--accent)"
        >
          <UserIcon width={18} height={18} />
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          aria-label="Sign out"
          title="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-md text-(--text-secondary) transition-colors hover:bg-(--surface-2) hover:text-(--danger)"
        >
          <LogoutIcon width={18} height={18} />
        </button>
      </div>
    </header>
  );
}
