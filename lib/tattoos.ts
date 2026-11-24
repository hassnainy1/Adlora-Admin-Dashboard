import { apiFetch, apiFetchEnvelope } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";

/**
 * Admin tattoo content-moderation API (`/api/tattoos/admin/all`,
 * `/api/tattoos/:id/moderate/:action`, `/api/tattoos/:id`).
 * Field shapes mirror the backend's `TattooResponse` / `TattooDetailResponse`
 * (see TattooScan-Backend `src/types/tattoo.ts` — there is no separate admin
 * DTO, the moderation list reuses the same shaping as the public feed/detail).
 *
 * `flag`/`remove` count toward the owner's violation strikes and drive
 * auto-suspension server-side — prefer them over the generic PATCH/DELETE.
 */

/** Raw backend status. DRAFT is unused for posts today but kept for completeness. */
export type RawTattooStatus = "ACTIVE" | "DRAFT" | "ARCHIVED" | "DELETED";

/** Friendly status used in the UI's filter tabs. */
export type TattooStatus = "published" | "flagged" | "removed" | "draft";

export const TATTOO_STATUS_TABS: { value: TattooStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "flagged", label: "Flagged" },
  { value: "removed", label: "Removed" },
  { value: "draft", label: "Draft" },
];

/** ARCHIVED = flagged, DELETED (soft-delete) = removed — mirrors the backend's moderate() mapping. */
export function rawStatusToFriendly(status: RawTattooStatus): TattooStatus {
  if (status === "DRAFT") return "draft";
  if (status === "ARCHIVED") return "flagged";
  if (status === "DELETED") return "removed";
  return "published";
}

export type ModerateAction = "approve" | "flag" | "remove";

export interface NamedRef {
  id: number;
  name: string;
}

export interface TattooAuthor {
  id: number;
  uuid: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: "USER" | "ARTIST";
  averageRating: number | null;
  reviewCount: number;
  specialities: NamedRef[];
}

export interface TattooMediaItem {
  id: number;
  fileUrl: string;
  thumbnailUrl: string | null;
  mimeType: string | null;
  isCover: boolean;
  displayOrder: number;
}

export interface AdminTattoo {
  id: number;
  uuid: string | null;
  title: string | null;
  description: string | null;
  privacy: "PRIVATE" | "TATTOO_ONLY" | "TATTOO_MEMORY" | "TATTOO_MEMORY_META" | string;
  bodyPlacement: string | null;
  status: RawTattooStatus;
  isPost: boolean;
  isMemory: boolean;
  tattooDate: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  shareCount: number;
  author: TattooAuthor | null;
  styles: NamedRef[];
  category: NamedRef | null;
  tags: NamedRef[];
  media: TattooMediaItem[];
  memoryCount: number;
}

export interface AdminTattooDetail extends AdminTattoo {
  isFavorited: boolean;
  favoriteCount: number;
  averageRating: number;
  reviewCount: number;
  comments: unknown[];
}

export interface TattooListFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: TattooStatus | RawTattooStatus;
  userId?: number;
}

function buildQuery(filters: TattooListFilters): URLSearchParams {
  const qs = new URLSearchParams();
  qs.set("page", String(filters.page ?? 1));
  qs.set("limit", String(filters.limit ?? 20));
  if (filters.search) qs.set("search", filters.search);
  if (filters.status) qs.set("status", filters.status);
  if (filters.userId != null) qs.set("userId", String(filters.userId));
  return qs;
}

export const tattoosApi = {
  list: (filters: TattooListFilters = {}): Promise<ApiEnvelope<AdminTattoo[]>> =>
    apiFetchEnvelope<AdminTattoo[]>(`tattoos/admin/all?${buildQuery(filters).toString()}`),

  /** Full "Tattoo Details" payload (author, media, comments, ratings) for one tattoo. */
  get: (tattooId: number) => apiFetch<AdminTattooDetail>(`tattoos/${tattooId}`),

  /** `remove` soft-deletes and returns no body — resolves to null in that case. */
  moderate: (tattooId: number, action: ModerateAction, adminNote?: string) =>
    apiFetch<AdminTattoo | null>(`tattoos/${tattooId}/moderate/${action}`, {
      method: "PATCH",
      ...(adminNote ? { body: JSON.stringify({ adminNote }) } : {}),
    }),

  update: (tattooId: number, data: Record<string, unknown>) =>
    apiFetch<AdminTattoo>(`tattoos/${tattooId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  remove: (tattooId: number) =>
    apiFetch<null>(`tattoos/${tattooId}`, { method: "DELETE" }),
};

export function tattooOwnerName(t: Pick<AdminTattoo, "author" | "id">): string {
  const a = t.author;
  if (!a) return `Tattoo #${t.id}`;
  return `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() || `User #${a.id}`;
}

/** Cover image: the media item flagged `isCover`, else the lowest `displayOrder`, else the first. */
export function tattooCoverMedia(t: Pick<AdminTattoo, "media">): TattooMediaItem | null {
  if (!t.media || t.media.length === 0) return null;
  return (
    t.media.find((m) => m.isCover) ??
    [...t.media].sort((a, b) => a.displayOrder - b.displayOrder)[0]
  );
}

const GRADIENT_CLASSES = [
  "from-(--c-violet) to-(--c-blue)",
  "from-(--c-rose) to-(--c-amber)",
  "from-(--c-cyan) to-(--c-emerald)",
  "from-(--c-blue) to-(--c-cyan)",
  "from-(--c-amber) to-(--c-rose)",
  "from-(--c-emerald) to-(--c-cyan)",
];

/** Deterministic fallback-thumbnail gradient for a tattoo (or its linked memory) with no cover image. */
export function tattooGradientClass(id: number): string {
  return GRADIENT_CLASSES[id % GRADIENT_CLASSES.length];
}

export function placementLabel(placement: string | null): string | null {
  if (!placement) return null;
  return placement
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
