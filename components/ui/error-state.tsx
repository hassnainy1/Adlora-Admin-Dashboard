import { Button } from "@/components/ui/button";

/** Fallback shown by route error boundaries when a page crashes while rendering. */
export function ErrorState({
  digest,
  onRetry,
}: {
  /** Next's server error id, shown so an admin can quote it when reporting the problem. */
  digest?: string;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="text-lg font-semibold text-(--text)">Something went wrong</h1>
      <p className="mt-1 max-w-sm text-sm text-(--text-muted)">
        This page couldn&apos;t be displayed. Try again, and if it keeps happening, contact support.
      </p>
      {digest && <p className="mt-2 font-mono text-xs text-(--text-subtle)">Error ID: {digest}</p>}
      <Button className="mt-5" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
