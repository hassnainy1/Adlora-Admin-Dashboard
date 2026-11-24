"use client";

import { useEffect } from "react";

/**
 * Tiny pub/sub used to refetch list data when a push notification says it went
 * stale — e.g. an incoming "Portfolio pending review" re-runs the artists list
 * so the Pending review tab shows the new submission without a manual reload.
 *
 * Deliberately not a data-fetching library: the managers already own their
 * `load()` callbacks, so all this needs to do is call them again.
 */
export type Resource =
  | "artists"
  | "users"
  | "support"
  | "reviews"
  | "ads"
  | "events"
  | "reports"
  | "notifications"
  | "blog";

type Listener = () => void;

const listeners = new Map<Resource, Set<Listener>>();

export function invalidate(...resources: Resource[]) {
  for (const resource of resources) {
    listeners.get(resource)?.forEach((fn) => fn());
  }
}

/**
 * Re-runs `onInvalidate` whenever `resource` is invalidated.
 * `onInvalidate` must be stable (wrap it in `useCallback`).
 */
export function useRefreshOn(resource: Resource, onInvalidate: Listener) {
  useEffect(() => {
    let set = listeners.get(resource);
    if (!set) {
      set = new Set();
      listeners.set(resource, set);
    }
    set.add(onInvalidate);
    return () => {
      set.delete(onInvalidate);
      if (set.size === 0) listeners.delete(resource);
    };
  }, [resource, onInvalidate]);
}

/**
 * Maps an incoming push onto the lists it invalidates.
 *
 * The backend's `data.resource` is authoritative when present; otherwise we
 * fall back to matching the notification title, since the `ADMIN` type alone
 * does not say which list changed.
 */
export function resourcesForPush(payload: {
  data?: Record<string, string>;
  notification?: { title?: string | null; body?: string | null };
}): Resource[] {
  const explicit = payload.data?.resource;
  if (explicit && isResource(explicit)) return [explicit, "notifications"];

  const text = `${payload.notification?.title ?? ""} ${payload.data?.type ?? ""}`.toLowerCase();

  if (text.includes("portfolio") || text.includes("artist")) {
    return ["artists", "notifications"];
  }
  if (text.includes("support") || text.includes("ticket")) {
    return ["support", "notifications"];
  }
  if (text.includes("advertisement")) return ["ads", "notifications"];
  if (text.includes("event")) return ["events", "notifications"];
  if (text.includes("report")) return ["reports", "notifications"];
  if (text.includes("review")) return ["reviews", "notifications"];
  if (text.includes("user") || text.includes("sign-up") || text.includes("signup")) {
    return ["users", "notifications"];
  }

  return ["notifications"];
}

function isResource(value: string): value is Resource {
  return (
    value === "artists" ||
    value === "users" ||
    value === "support" ||
    value === "reviews" ||
    value === "ads" ||
    value === "events" ||
    value === "reports" ||
    value === "notifications" ||
    value === "blog"
  );
}
