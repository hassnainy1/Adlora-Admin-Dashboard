"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ApiError } from "@/lib/api";
import { notificationsApi, type BroadcastTarget } from "@/lib/notifications";
import { cn } from "@/lib/cn";

const TARGETS: { value: BroadcastTarget; label: string; audience: string }[] = [
  { value: "ALL", label: "Everyone", audience: "everyone on the platform" },
  { value: "USERS", label: "Users only", audience: "all users" },
  { value: "ARTISTS", label: "Artists only", audience: "all artists" },
];

const fieldClass =
  "w-full rounded-md border border-(--border) bg-(--background) px-3 text-sm text-(--text) placeholder:text-(--text-subtle) outline-none transition-colors focus:border-(--accent)";

type View = "form" | "confirm" | "success";

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function BroadcastModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [view, setView] = useState<View>("form");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState<BroadcastTarget>("ALL");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Reset the form each time the modal is (re)opened — not a render loop.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (open) {
      setView("form");
      setTitle("");
      setBody("");
      setTarget("ALL");
      setImageUrl("");
      setError(null);
      setSending(false);
      setSuccessMessage(null);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open]);

  function reviewBroadcast(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    const trimmedImageUrl = imageUrl.trim();

    if (!trimmedTitle || trimmedTitle.length > 150) {
      setError("Title is required and must be 150 characters or fewer.");
      return;
    }
    if (!trimmedBody || trimmedBody.length > 1000) {
      setError("Message is required and must be 1000 characters or fewer.");
      return;
    }
    if (trimmedImageUrl && !isValidUrl(trimmedImageUrl)) {
      setError("Image URL must be a valid URL.");
      return;
    }

    setView("confirm");
  }

  async function sendBroadcast() {
    setError(null);
    setSending(true);
    try {
      const res = await notificationsApi.broadcast({
        title: title.trim(),
        body: body.trim(),
        target,
        ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
      });
      setSuccessMessage(res.message ?? `Broadcast sent to ${res.data.recipients} recipient(s)`);
      setView("success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send broadcast. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const audience = TARGETS.find((t) => t.value === target)?.audience ?? "everyone";

  return (
    <Modal open={open} onClose={onClose} title="Send Broadcast">
      {view === "form" && (
        <form onSubmit={reviewBroadcast} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-(--text-secondary)">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={150}
              placeholder="e.g. Platform maintenance tonight"
              className={cn(fieldClass, "h-10")}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-(--text-secondary)">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              maxLength={1000}
              rows={4}
              placeholder="Write the announcement…"
              className={cn(fieldClass, "resize-none py-2")}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-(--text-secondary)">
              Target audience
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TARGETS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTarget(t.value)}
                  className={cn(
                    "h-8 rounded-md px-3 text-sm font-medium transition-colors",
                    target === t.value
                      ? "bg-(--accent) text-(--accent-foreground)"
                      : "border border-(--border) bg-(--surface) text-(--text-secondary) hover:bg-(--surface-2)",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-(--text-secondary)">
              Image URL <span className="text-(--text-subtle)">(optional)</span>
            </label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              type="url"
              placeholder="https://example.com/banner.png"
              className={cn(fieldClass, "h-10")}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-(--danger) bg-(--danger-soft) px-3 py-2 text-sm text-(--danger)">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Continue</Button>
          </div>
        </form>
      )}

      {view === "confirm" && (
        <div className="space-y-4">
          <p className="text-sm text-(--text-secondary)">
            This will notify <span className="font-semibold text-(--text)">{audience}</span> —
            are you sure? This action is irreversible.
          </p>
          {error && (
            <p role="alert" className="rounded-md border border-(--danger) bg-(--danger-soft) px-3 py-2 text-sm text-(--danger)">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" disabled={sending} onClick={() => setView("form")}>
              Back
            </Button>
            <Button type="button" disabled={sending} onClick={() => void sendBroadcast()}>
              {sending ? "Sending…" : "Send Broadcast"}
            </Button>
          </div>
        </div>
      )}

      {view === "success" && (
        <div className="space-y-4">
          <p
            role="status"
            className="rounded-md border border-(--success) bg-(--success-soft) px-3 py-2 text-sm text-(--success)"
          >
            {successMessage}
          </p>
          <div className="flex justify-end">
            <Button type="button" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
