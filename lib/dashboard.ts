import { apiFetch } from "@/lib/api";

/**
 * Admin dashboard overview API (`/api/admin/dashboard/*`).
 * Each endpoint is independent — the page fetches them in parallel and
 * renders each section's own loading state rather than blocking on the
 * slowest one.
 */

export interface PercentStat {
  count: number;
  /** null hides the change badge. */
  changePercent: number | null;
}

export interface DeltaStat {
  count: number;
  change: number;
}

export interface DashboardStats {
  scansToday: PercentStat;
  memoriesCreated: PercentStat & { periodDays: number };
  pendingArtists: DeltaStat;
  openReports: DeltaStat;
}

export interface ScanActivityPoint {
  date: string;
  count: number;
}

export const REPORT_STATUSES = ["OPEN", "REVIEWING", "RESOLVED"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export interface ReportStatusSegment {
  status: ReportStatus;
  count: number;
  percent: number;
}

export const RECENT_ACTIVITY_TYPES = ["ARTIST_APPLICATION", "REPORT", "SUPPORT_TICKET"] as const;
export type RecentActivityType = (typeof RECENT_ACTIVITY_TYPES)[number];

export interface RecentActivityItem {
  type: RecentActivityType;
  id: number;
  title: string;
  description: string;
  createdAt: string;
}

export interface NeedsAttention {
  artistsAwaitingApproval: number;
  reportsToReview: number;
  openSupportTickets: number;
}

export const dashboardApi = {
  stats: (days = 7) => apiFetch<DashboardStats>(`admin/dashboard/stats?days=${days}`),

  scanActivity: (days = 7) =>
    apiFetch<ScanActivityPoint[]>(`admin/dashboard/scan-activity?days=${days}`),

  reportsByStatus: () => apiFetch<ReportStatusSegment[]>("admin/dashboard/reports-by-status"),

  recentActivity: (limit = 10) =>
    apiFetch<RecentActivityItem[]>(`admin/dashboard/recent-activity?limit=${limit}`),

  needsAttention: () => apiFetch<NeedsAttention>("admin/dashboard/needs-attention"),
};
