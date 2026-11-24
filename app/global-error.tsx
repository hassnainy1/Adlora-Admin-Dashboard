"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";
import "./globals.css";

/** Last resort: replaces the root layout when it crashes, so it must render its own html and body. */
export default function GlobalError({
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
    <html lang="en">
      <body className="flex min-h-dvh items-center justify-center p-4">
        <title>Something went wrong · Adlora Admin</title>
        <ErrorState digest={error.digest} onRetry={unstable_retry} />
      </body>
    </html>
  );
}
