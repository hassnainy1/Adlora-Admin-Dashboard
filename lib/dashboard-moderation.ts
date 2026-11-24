import { apiFetch, downloadFile } from "@/lib/api";

/**
 * Moderation analytics widget (`/api/admin/dashboard/moderation`).
 * Violation counts are enforced server-side: 3 strikes → in-app warning,
 * 5 strikes → auto-suspension. The UI only surfaces that state.
 */

export interface ModerationActor {
  firstName: string;
  lastName: string;
}

export interface ModerationRecentAction {
  id: number;
  actor: ModerationActor | null;
  action: string;
  auditableId: number | null;
  description: string | null;
  createdAt: string;
}

export interface TopViolator {
  id: number;
  firstName: string;
  lastName: string;
  status: string;
  violationCount: number;
  lastViolationAt: string | null;
}

export interface ModerationDashboard {
  totalActions: number;
  recentActions: ModerationRecentAction[];
  topViolators: TopViolator[];
}

export const moderationDashboardApi = {
  get: (limit = 20) => apiFetch<ModerationDashboard>(`admin/dashboard/moderation?limit=${limit}`),

  exportCsv: (limit = 20, filename = "moderation-activity.csv") =>
    downloadFile(`admin/dashboard/moderation?limit=${limit}&format=csv`, filename),
};

export function actorName(actor: ModerationActor | null): string {
  return actor ? `${actor.firstName} ${actor.lastName}`.trim() : "System";
}
