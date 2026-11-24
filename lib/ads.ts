import { apiFetch, apiFetchEnvelope } from "@/lib/api";
import type { BadgeTone } from "@/components/ui/badge";

/**
 * Admin ad moderation & management API (`/api/ads`).
 * Artist-created ads start PENDING and need approve/reject; admin-created
 * ads are auto-APPROVED.
 */

export const AD_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type AdStatus = (typeof AD_STATUSES)[number];

export const AD_STATUS_TONE: Record<AdStatus, BadgeTone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export interface AdCreator {
  id: number;
  firstName: string;
  lastName: string;
  studioName: string | null;
}

export interface Ad {
  id: number;
  uuid: string | null;
  title: string;
  tagline: string | null;
  description: string | null;
  imageUrl: string;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  status: AdStatus;
  rejectionReason: string | null;
  isActive: boolean;
  createdBy: AdCreator;
  createdAt: string;
  updatedAt: string;
}

export interface AdFormFields {
  image?: File;
  title?: string;
  tagline?: string;
  description?: string;
  phone?: string;
  email?: string;
  websiteUrl?: string;
}

function toFormData(fields: AdFormFields): FormData {
  const fd = new FormData();
  if (fields.image) fd.set("image", fields.image);
  if (fields.title) fd.set("title", fields.title);
  if (fields.tagline) fd.set("tagline", fields.tagline);
  if (fields.description) fd.set("description", fields.description);
  if (fields.phone) fd.set("phone", fields.phone);
  if (fields.email) fd.set("email", fields.email);
  if (fields.websiteUrl) fd.set("websiteUrl", fields.websiteUrl);
  return fd;
}

export function creatorName(creator: AdCreator): string {
  return `${creator.firstName} ${creator.lastName}`.trim() || "Unknown";
}

export const adsApi = {
  list: (params: { page?: number; limit?: number; status?: AdStatus } = {}) => {
    const qs = new URLSearchParams();
    qs.set("page", String(params.page ?? 1));
    qs.set("limit", String(params.limit ?? 20));
    if (params.status) qs.set("status", params.status);
    return apiFetchEnvelope<Ad[]>(`ads?${qs.toString()}`);
  },

  approve: (id: number) => apiFetch<Ad>(`ads/${id}/approve`, { method: "PATCH" }),

  reject: (id: number, reason?: string) =>
    apiFetch<Ad>(`ads/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify(reason ? { reason } : {}),
    }),

  create: (fields: AdFormFields) =>
    apiFetch<Ad>("ads", { method: "POST", body: toFormData(fields) }),

  update: (id: number, fields: AdFormFields) =>
    apiFetch<Ad>(`ads/${id}`, { method: "PATCH", body: toFormData(fields) }),

  remove: (id: number) => apiFetch<null>(`ads/${id}`, { method: "DELETE" }),
};
