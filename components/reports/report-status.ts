import type { BadgeTone } from "@/components/ui/badge";
import type { ReportableType, ReportStatus } from "@/lib/reports";

export const statusTone: Record<ReportStatus, BadgeTone> = {
  PENDING: "warning",
  IN_PROGRESS: "info",
  RESOLVED: "success",
  REJECTED: "neutral",
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

export const STATUS_OPTIONS: ReportStatus[] = ["PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"];

export const typeTone: Record<ReportableType, BadgeTone> = {
  TATTOO: "info",
  REVIEW: "accent",
  USER: "danger",
};

export const TYPE_LABELS: Record<ReportableType, string> = {
  TATTOO: "Tattoo",
  REVIEW: "Review",
  USER: "User",
};
