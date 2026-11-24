"use client";

import { Button } from "@/components/ui/button";
import { CheckIcon, FlagIcon, TrashIcon } from "@/components/icons";
import type { ModerateAction, TattooStatus } from "@/lib/tattoos";

/** Approve/Flag/Remove buttons — reused by the card grid and the detail modal, each hidden once it already matches the tattoo's current status. */
export function ModerationActions({
  status,
  busy,
  onAction,
}: {
  status: TattooStatus;
  busy: boolean;
  onAction: (action: ModerateAction, label: string) => void;
}) {
  return (
    <>
      {status !== "published" && (
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => onAction("approve", "Approve")}>
          <CheckIcon width={14} height={14} /> Approve
        </Button>
      )}
      {status !== "flagged" && (
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => onAction("flag", "Flag")}>
          <FlagIcon width={14} height={14} /> Flag
        </Button>
      )}
      {status !== "removed" && (
        <Button size="sm" variant="danger" disabled={busy} onClick={() => onAction("remove", "Remove")}>
          <TrashIcon width={14} height={14} /> Remove
        </Button>
      )}
    </>
  );
}
