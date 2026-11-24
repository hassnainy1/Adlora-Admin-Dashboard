import type { BadgeTone } from "@/components/ui/badge";
import type { ModerateAction, TattooStatus } from "@/lib/tattoos";

export const statusTone: Record<TattooStatus, BadgeTone> = {
  published: "success",
  flagged: "warning",
  removed: "danger",
  draft: "neutral",
};

/** flag/remove increment the owner's violation strikes — always ask for a note. */
export const NOTE_REQUIRED: ModerateAction[] = ["flag", "remove"];
