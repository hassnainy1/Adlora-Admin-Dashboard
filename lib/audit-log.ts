import { apiFetchEnvelope } from "@/lib/api";
import type { BadgeTone } from "@/components/ui/badge";

/**
 * Read-only admin audit log API (`/api/admin/audit-logs`).
 * Entries are written automatically by every sensitive admin action —
 * this file only covers listing/filtering them.
 */

export const AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "RESTORE",
  "LOGIN",
  "LOGOUT",
  "APPROVE",
  "REJECT",
  "BLOCK",
  "UNBLOCK",
  "VERIFY",
  "UNVERIFY",
  "EXPORT",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** Green for approve/unblock, red for reject/block/delete, neutral for everything else. */
export const AUDIT_ACTION_TONE: Record<AuditAction, BadgeTone> = {
  APPROVE: "success",
  UNBLOCK: "success",
  REJECT: "danger",
  BLOCK: "danger",
  DELETE: "danger",
  CREATE: "neutral",
  UPDATE: "neutral",
  RESTORE: "neutral",
  LOGIN: "neutral",
  LOGOUT: "neutral",
  VERIFY: "neutral",
  UNVERIFY: "neutral",
  EXPORT: "neutral",
};

/** Common target types surfaced as filter options; the field itself is a free-form string. */
export const AUDITABLE_TYPES = [
  "USER",
  "PORTFOLIO",
  "ARTIST_PORTFOLIO",
  "EVENT_REPORT",
  "AD",
] as const;

export interface AuditActor {
  id: number;
  firstName: string;
  lastName: string;
}

export interface AuditLogEntry {
  id: number;
  userId: number | null;
  actor: AuditActor | null;
  action: AuditAction;
  auditableId: number | null;
  auditableType: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  description: string | null;
  createdAt: string;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  userId?: number;
  action?: AuditAction;
  auditableType?: string;
  from?: string;
  to?: string;
}

export const auditLogApi = {
  list: (filters: AuditLogFilters = {}) => {
    const qs = new URLSearchParams();
    qs.set("page", String(filters.page ?? 1));
    qs.set("limit", String(filters.limit ?? 20));
    if (filters.userId) qs.set("userId", String(filters.userId));
    if (filters.action) qs.set("action", filters.action);
    if (filters.auditableType) qs.set("auditableType", filters.auditableType);
    if (filters.from) qs.set("from", filters.from);
    if (filters.to) qs.set("to", filters.to);
    return apiFetchEnvelope<AuditLogEntry[]>(`admin/audit-logs?${qs.toString()}`);
  },
};

export function actorName(actor: AuditActor | null): string {
  return actor ? `${actor.firstName} ${actor.lastName}`.trim() : "System";
}

export function targetLabel(entry: Pick<AuditLogEntry, "auditableType" | "auditableId">): string {
  if (!entry.auditableType) return "—";
  return entry.auditableId != null ? `${entry.auditableType} #${entry.auditableId}` : entry.auditableType;
}
