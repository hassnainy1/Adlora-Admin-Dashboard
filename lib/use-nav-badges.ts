"use client";

import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/dashboard";
import { supportApi } from "@/lib/support";
import { usersApi } from "@/lib/users";
import { adsApi } from "@/lib/ads";
import { useRefreshOn } from "@/lib/data-refresh";
import { useUnreadCount } from "@/lib/use-unread-count";

interface BadgeCounts {
  artistsPending: number;
  supportPending: number;
  adsPending: number;
  reportsToReview: number;
}

// Module-level singleton: the sidebar mounts twice (desktop + mobile drawer),
// so without sharing this state each of these 4 fetches ran twice on every
// page load. All subscribers now share one set of fetches instead.
let state: BadgeCounts = { artistsPending: 0, supportPending: 0, adsPending: 0, reportsToReview: 0 };
let started = false;
const subscribers = new Set<(state: BadgeCounts) => void>();

function notify() {
  subscribers.forEach((fn) => fn(state));
}

function set(partial: Partial<BadgeCounts>) {
  state = { ...state, ...partial };
  notify();
}

function loadArtists() {
  usersApi
    .list("ARTIST")
    .then((artists) => {
      set({
        artistsPending: artists.filter(
          (a) => a.isPortfolioUpdate && a.portfolioReviewStatus === "PENDING",
        ).length,
      });
    })
    .catch(() => {});
}

function loadSupport() {
  supportApi
    .list()
    .then((tickets) => set({ supportPending: tickets.filter((t) => t.status === "PENDING").length }))
    .catch(() => {});
}

function loadAds() {
  adsApi
    .list({ status: "PENDING", limit: 1 })
    .then((res) => set({ adsPending: res.pagination?.total ?? 0 }))
    .catch(() => {});
}

function loadReportsToReview() {
  dashboardApi
    .needsAttention()
    .then((d) => set({ reportsToReview: d.reportsToReview }))
    .catch(() => {});
}

function ensureStarted() {
  if (started) return;
  started = true;
  loadArtists();
  loadSupport();
  loadAds();
  loadReportsToReview();
}

/**
 * Live counts for sidebar nav badges, keyed by href. All read the real
 * backend — there's no live "flagged reviews" count exposed yet, so Reviews
 * intentionally has no badge rather than showing a stale/fake number.
 */
export function useNavBadges(): Record<string, number> {
  const [local, setLocal] = useState(state);
  const { count: unreadNotifications } = useUnreadCount();

  useEffect(() => {
    subscribers.add(setLocal);
    // Catches up on any state change between this hook's initial render and
    // this effect running; subsequent updates arrive via the subscriber set.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocal(state);
    ensureStarted();
    return () => {
      subscribers.delete(setLocal);
    };
  }, []);

  // Keep the badge counts in step with the lists themselves.
  useRefreshOn("artists", loadArtists);
  useRefreshOn("support", loadSupport);
  useRefreshOn("ads", loadAds);
  useRefreshOn("reports", loadReportsToReview);

  return {
    "/artists": local.artistsPending,
    "/reports": local.reportsToReview,
    "/support": local.supportPending,
    "/ads": local.adsPending,
    "/notifications": unreadNotifications,
  };
}
