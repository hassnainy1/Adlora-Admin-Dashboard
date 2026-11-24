"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * Reusable list toolbar: debounced search + status pills, both synced to the URL
 * via searchParams so the server page can read them and filter/paginate.
 */
export function ListToolbar({
  statuses,
  placeholder = "Search…",
}: {
  statuses: readonly string[];
  placeholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const status = searchParams.get("status") ?? statuses[0];
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const id = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) params.set("q", query);
      else params.delete("q");
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function setStatus(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === statuses[0]) params.delete("status");
    else params.set("status", next);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative max-w-sm flex-1">
        <SearchIcon
          width={16}
          height={16}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-(--text-subtle)"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-9 w-full rounded-md border border-(--border) bg-(--surface) pl-9 pr-3 text-sm text-(--text) placeholder:text-(--text-subtle) outline-none transition-colors focus:border-(--accent)"
        />
      </div>

      <div className="flex items-center gap-1 overflow-x-auto rounded-md border border-(--border) bg-(--surface) p-1">
        {statuses.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              "shrink-0 rounded px-3 py-1 text-xs font-medium capitalize transition-colors",
              status === s
                ? "bg-(--accent) text-(--accent-foreground)"
                : "text-(--text-muted) hover:bg-(--surface-2) hover:text-(--text)",
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
