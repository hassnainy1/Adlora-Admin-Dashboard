"use client";

import { useEffect, useState } from "react";
import { CloseIcon, SearchIcon } from "@/components/icons";
import { usersApi, fullName, type AdminUser } from "@/lib/users";

/** Name-search combobox for the Artist/Reviewer filters — resolves to a user id behind the scenes. */
export function PersonSearchInput({
  label,
  role,
  value,
  onChange,
}: {
  label: string;
  role?: "USER" | "ARTIST";
  value: AdminUser | null;
  onChange: (user: AdminUser | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !query.trim()) {
      // setState runs only for the query/open-driven reset — no render loop.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    setLoading(true);
    const id = setTimeout(() => {
      usersApi
        .listPaged({ search: query.trim(), role, limit: 8 })
        .then((res) => setResults(res.data))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(id);
  }, [query, open, role]);

  return (
    <div className="relative flex flex-col gap-1 text-xs font-medium text-(--text-muted)">
      {label}
      {value ? (
        <div className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-(--border) bg-(--surface) px-3 text-sm text-(--text) sm:w-48">
          <span className="truncate">{fullName(value)}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`Clear ${label} filter`}
            className="shrink-0 text-(--text-subtle) transition-colors hover:text-(--text)"
          >
            <CloseIcon width={12} height={12} />
          </button>
        </div>
      ) : (
        <div className="relative sm:w-48">
          <SearchIcon
            width={14}
            height={14}
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-(--text-subtle)"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search name…"
            className="h-9 w-full rounded-md border border-(--border) bg-(--surface) pl-8 pr-3 text-sm text-(--text) placeholder:text-(--text-subtle) outline-none transition-colors focus:border-(--accent)"
          />
        </div>
      )}

      {open && !value && query.trim() && (
        <div className="absolute top-full left-0 z-10 mt-1 max-h-56 w-full min-w-48 overflow-y-auto rounded-md border border-(--border) bg-(--surface) py-1 shadow-lg">
          {loading ? (
            <p className="px-3 py-1.5 text-xs text-(--text-subtle)">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-1.5 text-xs text-(--text-subtle)">No matches.</p>
          ) : (
            results.map((u) => (
              <button
                key={u.id}
                type="button"
                onMouseDown={() => {
                  onChange(u);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-sm text-(--text-secondary) transition-colors hover:bg-(--surface-2) hover:text-(--text)"
              >
                <span className="truncate">{fullName(u)}</span>
                {u.studioName && <span className="shrink-0 truncate text-xs text-(--text-subtle)">· {u.studioName}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
