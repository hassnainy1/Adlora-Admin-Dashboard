"use client";

import type { ReactNode } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/** Shared chart-widget shell: title/subtitle header + independent loading/error/content states. */
export function ChartCard<T>({
  title,
  subtitle,
  data,
  error,
  onRetry,
  skeletonClassName = "h-48 w-full",
  children,
}: {
  title: string;
  subtitle?: string;
  data: T | null;
  error: string | null;
  onRetry: () => void;
  skeletonClassName?: string;
  children: (data: T) => ReactNode;
}) {
  return (
    <Card glass>
      <CardHeader title={title} subtitle={subtitle} />
      <div className="p-5 pt-3">
        {error ? (
          <div className="flex flex-col items-start gap-2 py-6">
            <p className="text-sm text-(--danger)">{error}</p>
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Retry
            </Button>
          </div>
        ) : data ? (
          children(data)
        ) : (
          <Skeleton className={cn("rounded-md", skeletonClassName)} />
        )}
      </div>
    </Card>
  );
}
