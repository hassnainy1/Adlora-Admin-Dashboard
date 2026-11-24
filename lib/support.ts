import { apiFetch } from "@/lib/api";

/**
 * Support ticket admin API (Postman: Admin/Super Tickets).
 * The backend status enum is PENDING / IN_PROGRESS / RESOLVED.
 */

export const TICKET_STATUSES = ["PENDING", "IN_PROGRESS", "RESOLVED"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

export interface SupportTicket {
  id: number;
  userId: number;
  title: string;
  description: string;
  status: TicketStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export const supportApi = {
  list: (status?: TicketStatus) => {
    const qs = new URLSearchParams({ limit: "100" });
    if (status) qs.set("status", status);
    return apiFetch<SupportTicket[]>(`support-tickets/?${qs.toString()}`);
  },

  get: (id: number) => apiFetch<SupportTicket>(`support-tickets/${id}`),

  updateStatus: (id: number, status: TicketStatus) =>
    apiFetch<SupportTicket>(`support-tickets/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  remove: (id: number) =>
    apiFetch<null>(`support-tickets/${id}`, { method: "DELETE" }),
};
