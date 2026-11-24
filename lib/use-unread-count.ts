"use client";

import { useEffect, useState } from "react";
import { notificationsApi } from "@/lib/notifications";

const POLL_INTERVAL_MS = 30_000;

// Module-level singleton: the topbar bell, the sidebar badge (mounted twice —
// desktop + mobile drawer), and the FCM listener all call this hook. Without
// sharing state, each caller ran its own fetch and its own 30s interval,
// quadrupling the request count on every page. All subscribers now share one
// fetch/interval instead.
let count = 0;
let intervalId: ReturnType<typeof setInterval> | null = null;
let inFlight: Promise<void> | null = null;
const subscribers = new Set<(count: number) => void>();

function notify() {
  subscribers.forEach((fn) => fn(count));
}

function refresh(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = notificationsApi
    .unreadCount()
    .then((r) => {
      count = r.unreadCount;
      notify();
    })
    .catch(() => {})
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

function startPolling() {
  if (intervalId !== null) return;
  intervalId = setInterval(() => void refresh(), POLL_INTERVAL_MS);
}

function stopPolling() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/** Polls the admin's unread notification count; used by the topbar bell and the sidebar nav badge. */
export function useUnreadCount(): { count: number; refresh: () => void } {
  const [local, setLocal] = useState(count);

  useEffect(() => {
    subscribers.add(setLocal);
    // Catches up on any state change between this hook's initial render and
    // this effect running; subsequent updates arrive via the subscriber set.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocal(count);
    void refresh();
    startPolling();
    return () => {
      subscribers.delete(setLocal);
      if (subscribers.size === 0) stopPolling();
    };
  }, []);

  return { count: local, refresh: () => void refresh() };
}
