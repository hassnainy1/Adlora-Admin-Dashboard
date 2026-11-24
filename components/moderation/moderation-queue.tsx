"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ModerationIcon } from "@/components/icons";
import type { ModerationItem } from "@/lib/mock-data";
import { cn } from "@/lib/cn";

type Decision = "removed" | "kept";

export function ModerationQueue({ items }: { items: ModerationItem[] }) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  const remaining = items.filter((i) => !decisions[i.id]).length;

  function decide(id: string, decision: Decision) {
    // Optimistic — wire to moderation API later.
    setDecisions((prev) => ({ ...prev, [id]: decision }));
  }

  function undo(id: string) {
    setDecisions((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  if (items.length === 0) {
    return (
      <Card>
        <EmptyState icon={ModerationIcon} title="Queue is clear" description="No flagged content to review." />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-(--text-muted)">
        <span className="font-semibold text-(--text)">{remaining}</span> items to review
      </p>

      <div className="space-y-3">
        {items.map((item) => {
          const decision = decisions[item.id];
          return (
            <Card
              key={item.id}
              glass
              className={cn("p-4 transition-all duration-200", decision && "opacity-60")}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={item.type === "Tattoo" ? "accent" : "neutral"}>{item.type}</Badge>
                    <Badge tone="danger">{item.reportCount} reports</Badge>
                    <span className="text-xs text-(--text-subtle)">{item.reason}</span>
                    {decision && (
                      <Badge tone={decision === "removed" ? "danger" : "success"}>
                        {decision}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 truncate text-sm font-medium text-(--text)">{item.content}</p>
                  <p className="truncate text-xs text-(--text-subtle)">
                    by {item.author} · flagged {item.flagged}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  {!decision ? (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => decide(item.id, "kept")}>
                        Keep
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => decide(item.id, "removed")}>
                        Remove
                      </Button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => undo(item.id)}
                      className="text-xs font-medium text-(--accent) hover:underline"
                    >
                      Undo
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
