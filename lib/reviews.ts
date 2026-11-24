import { apiFetch, apiFetchEnvelope } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";

/**
 * Admin review-moderation API (`/api/reviews`, ADMIN-only by route guard —
 * no admin flag needed in the query string). A review targets exactly one of
 * `tattooId` (a "Rate Tattoo" review) or `artistId` (a "Rate Artist" review);
 * the other is always null.
 */

export interface ReviewUserRef {
  id: number;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl?: string | null;
}

export interface ReviewTattooRef {
  id: number;
  title: string | null;
  thumbnailUrl?: string | null;
}

export interface ReviewArtistRef {
  id: number;
  firstName: string | null;
  lastName: string | null;
  studioName?: string | null;
}

export interface AdminReview {
  id: number;
  userId: number;
  user: ReviewUserRef | null;
  rating: number;
  review: string | null;
  tattooId: number | null;
  tattoo: ReviewTattooRef | null;
  artistId: number | null;
  artist: ReviewArtistRef | null;
  artistReply: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewListFilters {
  page?: number;
  limit?: number;
  artistId?: number;
  userId?: number;
  tattooId?: number;
  rating?: number;
}

function buildQuery(filters: ReviewListFilters): URLSearchParams {
  const qs = new URLSearchParams();
  qs.set("page", String(filters.page ?? 1));
  qs.set("limit", String(filters.limit ?? 20));
  if (filters.artistId != null) qs.set("artistId", String(filters.artistId));
  if (filters.userId != null) qs.set("userId", String(filters.userId));
  if (filters.tattooId != null) qs.set("tattooId", String(filters.tattooId));
  if (filters.rating != null) qs.set("rating", String(filters.rating));
  return qs;
}

export const reviewsApi = {
  list: (filters: ReviewListFilters = {}): Promise<ApiEnvelope<AdminReview[]>> =>
    apiFetchEnvelope<AdminReview[]>(`reviews?${buildQuery(filters).toString()}`),

  get: (reviewId: number) => apiFetch<AdminReview>(`reviews/${reviewId}`),

  /** Hard delete — no soft-hide/undo exists server-side. Envelope keeps `message` for the toast. */
  remove: (reviewId: number): Promise<ApiEnvelope<null>> =>
    apiFetchEnvelope<null>(`reviews/${reviewId}`, { method: "DELETE" }),
};

export function reviewerName(r: Pick<AdminReview, "user" | "userId">): string {
  const u = r.user;
  if (!u) return `User #${r.userId}`;
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || `User #${u.id}`;
}

export type ReviewTargetType = "tattoo" | "artist";

export function reviewTargetType(r: Pick<AdminReview, "tattooId" | "artistId">): ReviewTargetType {
  return r.tattooId != null ? "tattoo" : "artist";
}

export function reviewTargetLabel(r: Pick<AdminReview, "tattooId" | "tattoo" | "artistId" | "artist">): string {
  if (r.tattooId != null) {
    return r.tattoo?.title?.trim() || `Tattoo #${r.tattooId}`;
  }
  const a = r.artist;
  if (!a) return `Artist #${r.artistId}`;
  return `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() || a.studioName || `Artist #${a.id}`;
}
