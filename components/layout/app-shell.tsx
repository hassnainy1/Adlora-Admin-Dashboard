"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, MotionConfig } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CloseIcon } from "@/components/icons";
import { FcmListener } from "@/components/notifications/fcm-listener";
import { cn } from "@/lib/cn";

const SIDEBAR_COLLAPSED_KEY = "adlora.sidebarCollapsed";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // Restore persisted collapsed state after mount (avoids SSR/client mismatch).
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
    } catch {}
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  // Close the drawer on Escape, trap focus inside it, and lock body scroll while it is open.
  useEffect(() => {
    if (!mobileOpen) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (e.key !== "Tab" || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("a[href], button")?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      lastFocusedRef.current?.focus();
    };
  }, [mobileOpen]);

  return (
    <MotionConfig reducedMotion="user">
    <FcmListener />
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 transition-[width] duration-200 lg:block",
          collapsed ? "w-16" : "w-(--sidebar-width)",
        )}
      >
        <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity duration-200",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={cn(
            "absolute inset-y-0 left-0 w-(--sidebar-width) max-w-[82%] shadow-xl transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            className="absolute -right-11 top-3 flex h-9 w-9 items-center justify-center rounded-md bg-(--surface) text-(--text-secondary) shadow-sm"
          >
            <CloseIcon width={18} height={18} />
          </button>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </div>
      </div>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
    </MotionConfig>
  );
}
