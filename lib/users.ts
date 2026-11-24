import { apiFetch, apiFetchEnvelope, downloadFile } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";

/**
 * Admin user API (Postman: Admin/User).
 * Status is "active" | "suspended"; suspend/activate are dedicated endpoints.
 */

export type UserStatus = "active" | "suspended" | "pending" | "deleted";
export type UserRole = "USER" | "ARTIST" | "ADMIN";
export type PortfolioReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PortfolioMedia {
  id: number;
  portfolioId: number;
  fileUrl: string;
  thumbnailUrl: string | null;
  mimeType: string;
  createdAt: string;
}

export interface PortfolioStyle {
  id: number;
  name: string;
  description?: string;
}

export interface Portfolio {
  id: number;
  title: string;
  description: string | null;
  isPublic: boolean;
  media: PortfolioMedia[];
  styles: PortfolioStyle[];
  /** Per-item moderation status — every portfolio piece is approved/rejected independently. */
  portfolioReviewStatus: PortfolioReviewStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: number;
  uuid: string | null;
  status: UserStatus;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isVerified: boolean;
  mobile?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  studioName?: string | null;
  bio?: string | null;
  experience?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  profileImageUrl?: string | null;
  /** True once the artist has submitted a portfolio for review. */
  isPortfolioUpdate: boolean;
  portfolioReviewStatus: PortfolioReviewStatus | null;
  specialities?: PortfolioStyle[];
  /** Only present on the single-user detail fetch (`usersApi.get`), not the list. */
  portfolios?: Portfolio[];
  createdAt: string;
  updatedAt: string;
}

export function fullName(u: Pick<AdminUser, "firstName" | "lastName">) {
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Unnamed user";
}

/** Row action available from the Users screen's action menu. */
export type UserAction = "suspend" | "activate" | "approve" | "reject" | "verify" | "unverify";

export interface UserListFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  specialityId?: number;
  portfolioReviewStatus?: PortfolioReviewStatus;
}

function buildQuery(filters: UserListFilters): URLSearchParams {
  const qs = new URLSearchParams();
  qs.set("page", String(filters.page ?? 1));
  qs.set("limit", String(filters.limit ?? 20));
  if (filters.search) qs.set("search", filters.search);
  if (filters.role) qs.set("role", filters.role);
  if (filters.status) qs.set("status", filters.status);
  if (filters.specialityId != null) qs.set("specialityId", String(filters.specialityId));
  if (filters.portfolioReviewStatus) qs.set("portfolioReviewStatus", filters.portfolioReviewStatus);
  return qs;
}

export const usersApi = {
  /** Unpaginated convenience list (used by pickers/filters elsewhere, e.g. audit log admin picker). */
  list: (role?: UserRole) =>
    apiFetch<AdminUser[]>(`users/?limit=100${role ? `&role=${role}` : ""}`),

  /** Server-paginated, filterable list for the Users screen. */
  listPaged: (filters: UserListFilters = {}): Promise<ApiEnvelope<AdminUser[]>> =>
    apiFetchEnvelope<AdminUser[]>(`users?${buildQuery(filters).toString()}`),

  exportCsv: (filters: UserListFilters = {}, filename = "users.csv") => {
    const qs = buildQuery(filters);
    qs.set("format", "csv");
    return downloadFile(`users?${qs.toString()}`, filename);
  },

  get: (id: number | string) => apiFetch<AdminUser>(`users/${id}`),

  action: (id: number, action: UserAction, reason?: string) =>
    apiFetch<AdminUser>(`users/${id}/${action}`, {
      method: "PATCH",
      ...(reason ? { body: JSON.stringify({ reason }) } : {}),
    }),

  suspend: (id: number, reason?: string) => usersApi.action(id, "suspend", reason),
  activate: (id: number, reason?: string) => usersApi.action(id, "activate", reason),
  approve: (id: number, reason?: string) => usersApi.action(id, "approve", reason),
  reject: (id: number, reason?: string) => usersApi.action(id, "reject", reason),
  verify: (id: number, reason?: string) => usersApi.action(id, "verify", reason),
  unverify: (id: number, reason?: string) => usersApi.action(id, "unverify", reason),
};

/** Moderates one portfolio piece — used when an already-approved artist uploads a new item. */
export const portfoliosApi = {
  approve: (id: number, reason?: string) =>
    apiFetch<Portfolio>(`users/portfolios/${id}/approve`, {
      method: "PATCH",
      ...(reason ? { body: JSON.stringify({ reason }) } : {}),
    }),
  reject: (id: number, reason?: string) =>
    apiFetch<Portfolio>(`users/portfolios/${id}/reject`, {
      method: "PATCH",
      ...(reason ? { body: JSON.stringify({ reason }) } : {}),
    }),
};
