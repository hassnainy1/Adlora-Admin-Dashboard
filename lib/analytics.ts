import { apiFetch } from "@/lib/api";

/** Admin dashboard analytics API (`/api/admin/dashboard/*`, admin-only). All endpoints accept `?days=7|30|90`. */

export interface TrendPoint {
  date: string;
  count: number;
}

export interface UploadsPoint {
  date: string;
  tattoos: number;
  memories: number;
  total: number;
}

/** Donut-chart slice — used by memories-by-type, privacy-levels, and popular-styles. */
export interface SharePart {
  label: string;
  count: number;
  percent: number;
}

export interface DauData {
  avgDau: { count: number; changePercent: number | null; trend: TrendPoint[] };
  stickiness: { percent: number; changePercent: number | null };
}

export interface ReviewRatingData {
  avgReviewRating: { value: number | null; changePercent: number | null };
}

export interface MemoryActivityData {
  memories: { count: number; changePercent: number | null; trend: TrendPoint[] };
}

function dashboardPath(endpoint: string, days: number, extra = ""): string {
  return `admin/dashboard/${endpoint}?days=${days}${extra}`;
}

export const analyticsApi = {
  dau: (days: number) => apiFetch<DauData>(dashboardPath("dau", days)),
  reviewRating: (days: number) => apiFetch<ReviewRatingData>(dashboardPath("review-rating", days)),
  memoryActivity: (days: number) => apiFetch<MemoryActivityData>(dashboardPath("memory-activity", days)),
  scanActivity: (days: number) => apiFetch<TrendPoint[]>(dashboardPath("scan-activity", days)),
  memoriesByType: (days: number) => apiFetch<SharePart[]>(dashboardPath("memories-by-type", days)),
  privacyLevels: (days: number) => apiFetch<SharePart[]>(dashboardPath("privacy-levels", days)),
  uploadsActivity: (days: number) => apiFetch<UploadsPoint[]>(dashboardPath("uploads-activity", days)),
  popularStyles: (days: number, limit = 5) =>
    apiFetch<SharePart[]>(dashboardPath("popular-styles", days, `&limit=${limit}`)),
};
