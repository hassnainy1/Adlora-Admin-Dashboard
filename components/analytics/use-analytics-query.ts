"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";

/**
 * Fetches one analytics widget's data for the current `days` range, independent
 * of every other widget on the page (own loading/error state, own retry).
 */
export function useAnalyticsQuery<T>(fetcher: (days: number) => Promise<T>, days: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    fetcher(days)
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load."));
  }, [fetcher, days]);

  useEffect(() => {
    // Resets to the loading state for the new `days`; the fetch's own setState
    // runs only after it resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(null);
    void load();
  }, [load]);

  return { data, loading: data === null && error === null, error, retry: load };
}
