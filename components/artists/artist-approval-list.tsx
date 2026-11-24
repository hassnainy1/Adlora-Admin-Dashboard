"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArtistsIcon } from "@/components/icons";
import type { ArtistApplication } from "@/lib/mock-data";
import { cn } from "@/lib/cn";

type Decision = "approved" | "rejected";

export function ArtistApprovalList({ items }: { items: ArtistApplication[] }) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  const pendingCount = items.filter((a) => !decisions[a.id]).length;

  function decide(id: string, decision: Decision) {
    // Optimistic local update — wire to a server action / API mutation later.
    setDecisions((prev) => ({ ...prev, [id]: decision }));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-(--text-muted)">
        <span className="font-semibold text-(--text)">{pendingCount}</span> awaiting review
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((a) => {
          const decision = decisions[a.id];
          return (
            <Card
              key={a.id}
              glass
              className={cn(
                "p-5 transition-all duration-200",
                decision && "opacity-60",
              )}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--c-violet-soft) text-(--c-violet)">
                  <ArtistsIcon width={22} height={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/artists/${a.id}`}
                      className="truncate font-semibold text-(--text) hover:text-(--accent)"
                    >
                      {a.name}
                    </Link>
                    {decision && (
                      <Badge tone={decision === "approved" ? "success" : "danger"}>
                        {decision}
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-sm text-(--text-muted)">
                    {a.studio} · {a.location}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {a.specialties.map((s) => (
                  <Badge key={s} tone="accent">
                    {s}
                  </Badge>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-(--border-subtle) pt-4">
                <span className="text-xs text-(--text-subtle)">
                  {a.portfolio} portfolio items · {a.submitted}
                </span>
                {!decision ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => decide(a.id, "rejected")}
                    >
                      Reject
                    </Button>
                    <Button size="sm" onClick={() => decide(a.id, "approved")}>
                      Approve
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setDecisions((prev) => {
                        const next = { ...prev };
                        delete next[a.id];
                        return next;
                      })
                    }
                    className="text-xs font-medium text-(--accent) hover:underline"
                  >
                    Undo
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
