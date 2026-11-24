"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

/** Renders inside the app shell, so the sidebar stays usable when one page crashes. */
export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState digest={error.digest} onRetry={unstable_retry} />;
}
