"use client";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { TrashIcon } from "@/components/icons";
import { STATUS_LABELS, TICKET_STATUSES, type SupportTicket, type TicketStatus } from "@/lib/support";
import type { AdminUser } from "@/lib/users";
import { UserCell } from "@/components/support/support-shared";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TicketDetailModal({
  ticket,
  user,
  userLoading,
  statusTone,
  savingStatus,
  onClose,
  onStatusChange,
  onDelete,
}: {
  ticket: SupportTicket | null;
  user: AdminUser | null;
  userLoading: boolean;
  statusTone: Record<TicketStatus, BadgeTone>;
  savingStatus: boolean;
  onClose: () => void;
  onStatusChange: (ticket: SupportTicket, status: TicketStatus) => void;
  onDelete: (ticket: SupportTicket) => void;
}) {
  if (!ticket) return null;

  return (
    <Modal open={ticket !== null} onClose={onClose} title="Ticket details" size="lg">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-wide text-(--text-muted) uppercase">Submitted by</p>
          <Badge tone={statusTone[ticket.status]}>{STATUS_LABELS[ticket.status]}</Badge>
        </div>
        <UserCell user={user} fallbackId={ticket.userId} loading={userLoading} size="lg" />

        <div className="border-t border-(--border-subtle) pt-4">
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-(--text-muted) uppercase">Subject</p>
          <p className="text-sm font-medium text-(--text)">{ticket.title}</p>
        </div>

        <div className="border-t border-(--border-subtle) pt-4">
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-(--text-muted) uppercase">Description</p>
          <p className="text-sm text-(--text-secondary) whitespace-pre-wrap">{ticket.description}</p>
        </div>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 border-t border-(--border-subtle) pt-4 text-sm sm:grid-cols-2">
          <Detail label="Ticket ID" value={`#${ticket.id}`} />
          <Detail label="Created" value={formatDate(ticket.createdAt)} />
          <Detail label="Updated" value={formatDate(ticket.updatedAt)} />
        </dl>

        <label className="flex flex-col gap-1 border-t border-(--border-subtle) pt-4 text-xs font-medium text-(--text-muted)">
          Status
          <select
            value={ticket.status}
            disabled={savingStatus}
            onChange={(e) => onStatusChange(ticket, e.target.value as TicketStatus)}
            className="h-9 w-full rounded-md border border-(--border) bg-(--surface) px-2 text-sm text-(--text) outline-none transition-colors focus:border-(--accent) disabled:opacity-50"
          >
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>

        <div className="flex justify-end gap-2 border-t border-(--border-subtle) pt-4">
          <Button variant="danger" size="sm" onClick={() => onDelete(ticket)}>
            <TrashIcon width={14} height={14} /> Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-(--border-subtle) py-1.5">
      <dt className="text-(--text-muted)">{label}</dt>
      <dd className="truncate text-right font-medium text-(--text)">{value}</dd>
    </div>
  );
}
