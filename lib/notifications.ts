import { apiFetch, apiFetchEnvelope, type Pagination } from "@/lib/api";
import type { BadgeTone } from "@/components/ui/badge";
import {
  BellIcon,
  ModerationIcon,
  EventsIcon,
  MessageIcon,
  TicketsIcon,
  HeartIcon,
  StarIcon,
  UsersIcon,
  UserPlusIcon,
  type Icon,
} from "@/components/icons";

/**
 * Admin notification center API (`/api/notifications/*`).
 */

export const NOTIFICATION_TYPES = [
  "SYSTEM",
  "MESSAGE",
  "LIKE",
  "COMMENT",
  "FAVORITE",
  "REVIEW",
  "FOLLOW",
  "EVENT",
  "SUPPORT",
  "ADMIN",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Maps each notification type onto the app's existing 6 Badge tones (no new colors introduced). */
export const NOTIFICATION_TYPE_TONE: Record<NotificationType, BadgeTone> = {
  SYSTEM: "neutral",
  ADMIN: "accent",
  EVENT: "accent",
  MESSAGE: "info",
  SUPPORT: "info",
  COMMENT: "info",
  LIKE: "danger",
  FAVORITE: "danger",
  REVIEW: "warning",
  FOLLOW: "success",
};

/** Friendly label shown next to each notification (e.g. "General" for a plain SYSTEM push). */
export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  SYSTEM: "General",
  ADMIN: "Admin",
  EVENT: "Events",
  MESSAGE: "Message",
  SUPPORT: "Support",
  COMMENT: "Comment",
  LIKE: "Like",
  FAVORITE: "Favorite",
  REVIEW: "Review",
  FOLLOW: "Follow",
};

/** Maps each notification type onto an icon rendered in the dropdown/list row avatar. */
export const NOTIFICATION_TYPE_ICON: Record<NotificationType, Icon> = {
  SYSTEM: BellIcon,
  ADMIN: ModerationIcon,
  EVENT: EventsIcon,
  MESSAGE: MessageIcon,
  SUPPORT: TicketsIcon,
  COMMENT: MessageIcon,
  LIKE: HeartIcon,
  FAVORITE: HeartIcon,
  REVIEW: StarIcon,
  FOLLOW: UsersIcon,
};

/**
 * Most notifications are visualized by their `type` alone, but admin/system
 * pushes announcing a brand-new artist/user sign-up get a dedicated
 * person-plus icon + green tone so they stand out from generic admin notices.
 */
export function notificationVisual(
  n: Pick<AdminNotification, "type" | "title" | "body">,
): { icon: Icon; tone: BadgeTone } {
  const text = `${n.title} ${n.body}`.toLowerCase();
  const isNewSignup =
    (n.type === "ADMIN" || n.type === "SYSTEM") &&
    (text.includes("new artist") ||
      text.includes("new user") ||
      text.includes("sign-up") ||
      text.includes("signup") ||
      text.includes("registered") ||
      text.includes("application"));

  if (isNewSignup) return { icon: UserPlusIcon, tone: "success" };
  return { icon: NOTIFICATION_TYPE_ICON[n.type], tone: NOTIFICATION_TYPE_TONE[n.type] };
}

export interface NotificationSender {
  id: number;
  uuid: string | null;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
}

export interface AdminNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  imageUrl: string | null;
  notifiableId: number | null;
  notifiableType: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  sender: NotificationSender | null;
}

export type BroadcastTarget = "ALL" | "USERS" | "ARTISTS";

export interface BroadcastPayload {
  title: string;
  body: string;
  target: BroadcastTarget;
  imageUrl?: string;
}

export interface BroadcastResult {
  recipients: number;
}

export const notificationsApi = {
  list: (params: { page?: number; limit?: number; unreadOnly?: boolean } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    if (params.unreadOnly) qs.set("unreadOnly", "true");
    const query = qs.toString();
    return apiFetchEnvelope<AdminNotification[]>(`notifications${query ? `?${query}` : ""}`);
  },

  unreadCount: () =>
    apiFetch<{ unreadCount: number }>("notifications/unread-count"),

  markRead: (id: number) =>
    apiFetch<AdminNotification>(`notifications/${id}/read`, { method: "PATCH" }),

  markAllRead: () =>
    apiFetch<null>("notifications/read-all", { method: "PATCH" }),

  remove: (id: number) =>
    apiFetch<null>(`notifications/${id}`, { method: "DELETE" }),

  clearAll: () => apiFetch<null>("notifications/clear-all", { method: "DELETE" }),

  broadcast: (payload: BroadcastPayload) =>
    apiFetchEnvelope<BroadcastResult>("notifications/broadcast", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Reports the browser's FCM registration token so the backend can target this device. */
  registerDevice: (token: string) =>
    apiFetch<null>("notifications/devices", {
      method: "POST",
      body: JSON.stringify({ token, platform: "web" }),
    }),

  /** Clears the token on logout so pushes stop reaching this device. */
  unregisterDevice: (token: string) =>
    apiFetch<null>("notifications/devices", {
      method: "DELETE",
      body: JSON.stringify({ token }),
    }),
};

/** Backend's `NotifiableType` enum — the polymorphic target a notification points at. */
export const NOTIFIABLE_TYPES = [
  "TATTOO",
  "MEMORY",
  "ARTIST",
  "CONVERSATION",
  "EVENT",
  "SUPPORT_TICKET",
  "COMMENT",
] as const;
export type NotifiableType = (typeof NOTIFIABLE_TYPES)[number];

export interface NotificationLink {
  href: string;
}

type NotifiablePick = Pick<AdminNotification, "notifiableType" | "notifiableId" | "sender">;

/**
 * Resolves each `notifiableType` to where it lands in the admin dashboard.
 * TATTOO/MEMORY/EVENT/SUPPORT_TICKET have no id-based detail route yet, so
 * they go to their section's list page rather than a specific record.
 * CONVERSATION and COMMENT have no admin page at all (no chat/comment
 * moderation screen exists) — those resolve to null (no link).
 */
const NOTIFIABLE_HREF: Partial<Record<NotifiableType, (n: NotifiablePick) => string | null>> = {
  ARTIST: (n) => {
    const id = n.notifiableId ?? n.sender?.id;
    return id != null ? `/artists/${id}` : null;
  },
  TATTOO: () => "/tattoos",
  MEMORY: () => "/memories",
  EVENT: () => "/events",
  SUPPORT_TICKET: () => "/support",
};

/**
 * Resolves a notification to somewhere in the admin dashboard using the
 * backend's polymorphic `notifiableType`/`notifiableId` pair. Returns null
 * when nothing resolves (no `notifiableType` at all, or one with no admin
 * page yet, like CONVERSATION/COMMENT).
 */
export function resolveNotificationLink(n: NotifiablePick): NotificationLink | null {
  if (!n.notifiableType) return null;
  const resolver = NOTIFIABLE_HREF[n.notifiableType.toUpperCase() as NotifiableType];
  if (!resolver) return null;
  const href = resolver(n);
  return href ? { href } : null;
}

export type { Pagination };

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
