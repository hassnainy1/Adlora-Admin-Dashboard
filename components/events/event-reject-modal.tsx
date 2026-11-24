"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ApiError } from "@/lib/api";
import type { Event } from "@/lib/events";

/** Reusable reason-required reject form — the backend requires a non-empty reason. */
export function EventRejectModal({
  event,
  onClose,
  onConfirm,
}: {
  event: Event | null;
  onClose: () => void;
  onConfirm: (event: Event, reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleClose() {
    if (busy) return;
    setReason("");
    setError(null);
    onClose();
  }

  async function run() {
    if (!event) return;
    if (!reason.trim()) {
      setError("A reason is required to reject this event.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onConfirm(event, reason.trim());
      setReason("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reject event.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={event !== null} onClose={handleClose} title="Reject event">
      {event && (
        <div className="space-y-4">
          <p className="text-sm text-(--text-secondary)">
            Reject <span className="font-semibold text-(--text)">{event.title}</span>? The organizer
            will be notified with your reason.
          </p>
          <label className="block space-y-1 text-sm">
            <span className="text-(--text-muted)">
              Reason <span className="text-(--danger)">*</span>
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Missing venue details"
              className="w-full resize-none rounded-md border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text) outline-none transition-colors focus:border-(--accent)"
            />
          </label>
          {error && (
            <p role="alert" className="rounded-md border border-(--danger) bg-(--danger-soft) px-3 py-2 text-sm text-(--danger)">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="button" variant="danger" disabled={busy} onClick={() => void run()}>
              {busy ? "Rejecting…" : "Reject"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
