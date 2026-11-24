import { apiFetch, apiFetchEnvelope } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/api";

/**
 * Admin memory-moderation API (`/api/tattoos/memories/admin/all`,
 * `/api/tattoos/memories/:memoryId/moderate/:action`). Mirrors the tattoo
 * moderation API in `lib/tattoos.ts`, but simpler: TattooMemory has no
 * separate soft-delete flag, so its `status` field alone is authoritative
 * (no tattoos.ts-style "removed can't be told apart from active" caveat).
 */

export type MemoryType = "text" | "image" | "video";
export type RawMemoryStatus = "ACTIVE" | "ARCHIVED" | "DELETED";
export type MemoryStatus = "published" | "flagged" | "removed";

export const MEMORY_TYPE_TABS: { value: MemoryType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "text", label: "Text" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
];

export const MEMORY_STATUS_TABS: { value: MemoryStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "flagged", label: "Flagged" },
  { value: "removed", label: "Removed" },
];

/** ACTIVE = published, ARCHIVED = flagged, DELETED = removed (status is authoritative — no deletedAt on this model). */
export function rawMemoryStatusToFriendly(status: RawMemoryStatus): MemoryStatus {
  if (status === "ARCHIVED") return "flagged";
  if (status === "DELETED") return "removed";
  return "published";
}

export type MemoryPrivacy = "PRIVATE" | "TATTOO_ONLY" | "TATTOO_MEMORY" | "TATTOO_MEMORY_METADATA";

export const MEMORY_PRIVACY_LABEL: Record<MemoryPrivacy, string> = {
  PRIVATE: "Private",
  TATTOO_ONLY: "Tattoo only",
  TATTOO_MEMORY: "Tattoo + memory",
  TATTOO_MEMORY_METADATA: "Tattoo + memory + metadata",
};

export type ModerateAction = "approve" | "flag" | "remove";

/** Deterministic per the backend's moderateMemory() — used to patch locally since it returns no body. */
export const MODERATE_ACTION_STATUS: Record<ModerateAction, RawMemoryStatus> = {
  approve: "ACTIVE",
  flag: "ARCHIVED",
  remove: "DELETED",
};

export interface MemoryOwner {
  id: number;
  firstName: string | null;
  lastName: string | null;
}

export interface MemoryTattooRef {
  id: number;
  title: string | null;
}

export interface MemoryMedia {
  id: number;
  fileUrl: string;
  thumbnailUrl: string | null;
  mimeType: string;
}

export interface AdminMemory {
  id: number;
  title: string | null;
  story: string | null;
  type: MemoryType;
  privacy: MemoryPrivacy;
  status: RawMemoryStatus;
  owner: MemoryOwner;
  tattoo: MemoryTattooRef;
  media: MemoryMedia[];
  createdAt: string;
}

export function memoryCoverUrl(m: Pick<AdminMemory, "media">): string | null {
  const first = m.media?.find((mm) => mm.mimeType?.startsWith("image/")) ?? m.media?.[0];
  if (!first) return null;
  return first.thumbnailUrl ?? first.fileUrl;
}

export interface MemoryListFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: MemoryType;
  status?: MemoryStatus | RawMemoryStatus;
}

function buildQuery(filters: MemoryListFilters): URLSearchParams {
  const qs = new URLSearchParams();
  qs.set("page", String(filters.page ?? 1));
  qs.set("limit", String(filters.limit ?? 20));
  if (filters.search) qs.set("search", filters.search);
  if (filters.type) qs.set("type", filters.type);
  if (filters.status) qs.set("status", filters.status);
  return qs;
}

export const memoriesApi = {
  list: (filters: MemoryListFilters = {}): Promise<ApiEnvelope<AdminMemory[]>> =>
    apiFetchEnvelope<AdminMemory[]>(`tattoos/memories/admin/all?${buildQuery(filters).toString()}`),

  /** Returns no body (backend sends `{success, message}` only) — callers patch state from the action itself. */
  moderate: (memoryId: number, action: ModerateAction, adminNote?: string) =>
    apiFetch<void>(`tattoos/memories/${memoryId}/moderate/${action}`, {
      method: "PATCH",
      ...(adminNote ? { body: JSON.stringify({ adminNote }) } : {}),
    }),
};

export function memoryOwnerName(m: Pick<AdminMemory, "owner" | "id">): string {
  const o = m.owner;
  if (!o) return `Memory #${m.id}`;
  return `${o.firstName ?? ""} ${o.lastName ?? ""}`.trim() || `User #${o.id}`;
}

export function memoryTitle(m: Pick<AdminMemory, "title" | "id">): string {
  return m.title?.trim() || `Memory #${m.id}`;
}
