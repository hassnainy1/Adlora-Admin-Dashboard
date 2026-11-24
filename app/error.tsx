"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

/** Catches crashes on the auth pages and in the dashboard's shell itself. */
export default function RootError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <ErrorState digest={error.digest} onRetry={unstable_retry} />
    </div>
  );
}
