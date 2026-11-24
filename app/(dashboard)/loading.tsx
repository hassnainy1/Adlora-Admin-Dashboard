import { Skeleton } from "@/components/ui/skeleton";

/** Generic page placeholder shown while a dashboard route loads. */
export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8"
    >
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded" />
        <Skeleton className="h-4 w-72 max-w-full rounded" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-(--radius)" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-(--radius)" />
    </div>
  );
}
