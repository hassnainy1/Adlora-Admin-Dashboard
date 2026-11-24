import { apiFetch, apiFetchEnvelope } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";

/** Admin report-moderation API (`/api/reports`) — admins see every report, regular users only their own. */

export type ReportableType = "TATTOO" | "REVIEW" | "USER";
export type ReportStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";

export interface ReportReporterProfile {
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

export interface ReportReporter {
  id: number;
  uuid: string;
  profile: ReportReporterProfile | null;
}

export interface AdminReport {
  id: number;
  reporterId: number;
  reportableId: number;
  reportableType: ReportableType;
  reason: string;
  description: string | null;
  status: ReportStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  reporter: ReportReporter;
}

export interface ReportListFilters {
  page?: number;
  limit?: number;
  status?: ReportStatus;
}

export interface ReportUpdatePayload {
  status: ReportStatus;
  adminNote?: string | null;
}

function buildQuery(filters: ReportListFilters): URLSearchParams {
  const qs = new URLSearchParams();
  qs.set("page", String(filters.page ?? 1));
  qs.set("limit", String(filters.limit ?? 20));
  if (filters.status) qs.set("status", filters.status);
  return qs;
}

export const reportsApi = {
  list: (filters: ReportListFilters = {}): Promise<ApiEnvelope<AdminReport[]>> =>
    apiFetchEnvelope<AdminReport[]>(`reports?${buildQuery(filters).toString()}`),

  updateStatus: (reportId: number, payload: ReportUpdatePayload) =>
    apiFetch<AdminReport>(`reports/${reportId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

export function reporterName(r: Pick<AdminReport, "reporter" | "reporterId">): string {
  const p = r.reporter?.profile;
  if (!p) return `User #${r.reporterId}`;
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || `User #${r.reporter.id}`;
}
