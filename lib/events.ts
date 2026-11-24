import { apiFetch, apiFetchEnvelope } from "@/lib/api";
import type { BadgeTone } from "@/components/ui/badge";

/**
 * Admin events management & moderation API (`/api/events`).
 * Admins see events at every approval stage; non-admins only see APPROVED ones.
 */

// Adjust these to match the backend's actual EventType / EventStatus enums.
export const EVENT_TYPES = ["EXPO", "CONVENTION", "WORKSHOP", "MEETUP", "OTHER"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_STATUSES = ["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_STATUS_TONE: Record<EventStatus, BadgeTone> = {
  UPCOMING: "info",
  ONGOING: "success",
  COMPLETED: "neutral",
  CANCELLED: "danger",
};

export const APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const APPROVAL_STATUS_TONE: Record<ApprovalStatus, BadgeTone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export interface EventCreator {
  id: number;
  firstName: string;
  lastName: string;
  studioName: string | null;
}

export interface EventMedia {
  id: number;
  fileUrl: string;
  thumbnailUrl: string | null;
  mimeType: string;
}

export interface EventArtist {
  artistId: number;
  boothNumber: string | null;
  artist?: {
    id: number;
    firstName: string;
    lastName: string;
    studioName: string | null;
    profileImageUrl?: string | null;
  };
}

export interface EventGuest {
  name: string;
  designation: string | null;
  imageUrl: string | null;
}

export interface EventHighlight {
  title: string;
}

export interface Event {
  id: number;
  title: string;
  description: string | null;
  type: EventType;
  status: EventStatus;
  approvalStatus: ApprovalStatus;
  startDate: string;
  endDate: string;
  venue: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  ticketPrice: number | null;
  currency: string | null;
  websiteUrl: string | null;
  isFeatured: boolean;
  coverImage: string | null;
  media: EventMedia[];
  artists: EventArtist[];
  guests: EventGuest[];
  highlights: EventHighlight[];
  createdBy: EventCreator;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface EventPersonRef {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl: string | null;
}

export interface EventAttendee {
  id: number;
  /** Sometimes present even when the nested `user` isn't — falls back to this for enrichment. */
  userId?: number;
  user?: EventPersonRef | null;
  status: string;
  createdAt: string;
}

export interface EventFollower {
  id: number;
  /** Sometimes present even when the nested `user` isn't — falls back to this for enrichment. */
  userId?: number;
  user?: EventPersonRef | null;
  createdAt: string;
}

/**
 * `${undefined}` stringifies to the literal word "undefined", so a plain
 * template literal here would print "undefined undefined" instead of falling
 * back — this guards each half before joining.
 */
export function creatorName(creator: EventCreator | null | undefined): string {
  if (!creator) return "Unknown";
  return `${creator.firstName ?? ""} ${creator.lastName ?? ""}`.trim() || "Unknown";
}

export function eventLocation(event: Event): string {
  return [event.city, event.state, event.country].filter(Boolean).join(", ") || "—";
}

/**
 * One change to make to an event's media. The action is inferred server-side
 * from which fields are present — there's no explicit action flag, and any
 * existing media item not mentioned here is left untouched:
 *   - `id` + `file` → replace that item's file
 *   - `id` only      → delete that item
 *   - `file` only    → add a new item
 */
export interface EventMediaEdit {
  id?: number;
  file?: File;
}

export interface EventFormFields {
  title?: string;
  description?: string;
  type?: EventType;
  status?: EventStatus;
  startDate?: string;
  endDate?: string;
  venue?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  ticketPrice?: number;
  currency?: string;
  websiteUrl?: string;
  isFeatured?: boolean;
  coverImage?: File;
  artists?: { artistId: number; boothNumber?: string }[];
  guests?: { name: string; designation?: string; imageUrl?: string }[];
  highlights?: { title: string }[];
  media?: EventMediaEdit[];
}

const SCALAR_FIELDS = [
  "title",
  "description",
  "type",
  "status",
  "startDate",
  "endDate",
  "venue",
  "address",
  "city",
  "state",
  "country",
  "latitude",
  "longitude",
  "ticketPrice",
  "currency",
  "websiteUrl",
] as const;

function toFormData(fields: EventFormFields): FormData {
  const fd = new FormData();

  for (const key of SCALAR_FIELDS) {
    const value = fields[key];
    if (value !== undefined) fd.set(key, String(value));
  }
  if (fields.isFeatured !== undefined) fd.set("isFeatured", String(fields.isFeatured));
  if (fields.coverImage) fd.set("coverImage", fields.coverImage);
  if (fields.artists) fd.set("artists", JSON.stringify(fields.artists));
  if (fields.guests) fd.set("guests", JSON.stringify(fields.guests));
  if (fields.highlights) fd.set("highlights", JSON.stringify(fields.highlights));

  if (fields.media && fields.media.length > 0) {
    // `fileIndex` is the position among only the *uploaded* files (all sent
    // under the repeated "media" field, in order) — not the position in this
    // edits array, which may also contain id-only (delete) entries with no file.
    let uploadIndex = 0;
    fields.media.forEach((m, i) => {
      if (m.id != null) fd.set(`media[${i}][id]`, String(m.id));
      if (m.file) {
        fd.append("media", m.file);
        fd.set(`media[${i}][fileIndex]`, String(uploadIndex));
        uploadIndex++;
      }
    });
  }

  return fd;
}

export interface EventListParams {
  page?: number;
  limit?: number;
  type?: EventType;
  status?: EventStatus;
  approvalStatus?: ApprovalStatus;
  city?: string;
  state?: string;
  country?: string;
  startDateFrom?: string;
  startDateTo?: string;
  search?: string;
  isFeatured?: boolean;
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  return qs.toString();
}

export const eventsApi = {
  list: (params: EventListParams = {}) => {
    const qs = buildQuery({
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      type: params.type,
      status: params.status,
      approvalStatus: params.approvalStatus,
      city: params.city,
      state: params.state,
      country: params.country,
      startDateFrom: params.startDateFrom,
      startDateTo: params.startDateTo,
      search: params.search,
      isFeatured: params.isFeatured,
    });
    return apiFetchEnvelope<Event[]>(`events?${qs}`);
  },

  get: (id: number) => apiFetch<Event>(`events/${id}`),

  approve: (id: number) => apiFetch<Event>(`events/${id}/approve`, { method: "PATCH" }),

  reject: (id: number, reason: string) =>
    apiFetch<Event>(`events/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),

  create: (fields: EventFormFields) =>
    apiFetch<Event>("events", { method: "POST", body: toFormData(fields) }),

  update: (id: number, fields: EventFormFields) =>
    apiFetch<Event>(`events/${id}`, { method: "PATCH", body: toFormData(fields) }),

  setFeatured: (id: number, isFeatured: boolean) =>
    apiFetch<Event>(`events/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isFeatured }),
    }),

  remove: (id: number) => apiFetch<null>(`events/${id}`, { method: "DELETE" }),

  attendees: (id: number, params: { page?: number; limit?: number } = {}) => {
    const qs = buildQuery({ page: params.page ?? 1, limit: params.limit ?? 20 });
    return apiFetchEnvelope<EventAttendee[]>(`events/${id}/attendees?${qs}`);
  },

  /** Admin- or event-creator-only. */
  followers: (id: number, params: { page?: number; limit?: number } = {}) => {
    const qs = buildQuery({ page: params.page ?? 1, limit: params.limit ?? 20 });
    return apiFetchEnvelope<EventFollower[]>(`events/${id}/followers?${qs}`);
  },
};
