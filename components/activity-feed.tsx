"use client";

import { useState } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/notifications";
import { type RecentActivityItem, type RecentActivityType } from "@/lib/dashboard";

const TYPE_META: Record<RecentActivityType, { tag: string; tone: BadgeTone }> = {
  ARTIST_APPLICATION: { tag: "Artist", tone: "accent" },
  REPORT: { tag: "Report", tone: "danger" },
  SUPPORT_TICKET: { tag: "Support", tone: "warning" },
};

type Tab = "ALL" | RecentActivityType;
const TABS: { id: Tab; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "REPORT", label: "Reports" },
  { id: "SUPPORT_TICKET", label: "Support" },
  { id: "ARTIST_APPLICATION", label: "Artists" },
];

export function ActivityFeed({ items }: { items: RecentActivityItem[] }) {
  const [tab, setTab] = useState<Tab>("ALL");

  const filtered = tab === "ALL" ? items : items.filter((i) => i.type === tab);

  return (
    <div>
      <div className="flex items-center gap-1 overflow-x-auto border-b border-(--border-subtle) px-3">
        {TABS.map((t) => {
          const active = t.id === tab;
          const count = t.id === "ALL" ? items.length : items.filter((i) => i.type === t.id).length;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative shrink-0 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                active ? "text-(--accent)" : "text-(--text-muted) hover:text-(--text)",
              )}
            >
              {t.label}
              <span className="ml-1.5 text-xs text-(--text-subtle)">{count}</span>
              {active && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-(--accent)" />
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-(--text-muted)">
          Nothing here right now.
        </p>
      ) : (
        <ul className="divide-y divide-(--border-subtle)">
          {filtered.map((item) => {
            const meta = TYPE_META[item.type];
            return (
              <li
                key={`${item.type}-${item.id}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-(--surface-hover)"
              >
                <Badge tone={meta.tone}>{meta.tag}</Badge>
                <span
                  className="min-w-0 flex-1 truncate text-sm text-(--text-secondary)"
                  title={item.description || item.title}
                >
                  {item.description ? `${item.title} — ${item.description}` : item.title}
                </span>
                <span className="shrink-0 text-xs text-(--text-subtle)">{timeAgo(item.createdAt)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
