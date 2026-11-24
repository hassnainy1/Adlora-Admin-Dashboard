"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ApiError } from "@/lib/api";
import { adsApi } from "@/lib/ads";

const FIELDS: { key: "tagline" | "phone" | "email" | "websiteUrl"; label: string; type: string }[] = [
  { key: "tagline", label: "Tagline", type: "text" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "email", label: "Email", type: "email" },
  { key: "websiteUrl", label: "Website URL", type: "url" },
];

export function AdFormModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  useEffect(() => {
    if (!image) {
      // Resets the preview to match a cleared file input — tied to an external
      // object-URL lifecycle, not derivable state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  function reset() {
    setTitle("");
    setDescription("");
    setValues({});
    setImage(null);
    setError(null);
    setBusy(false);
  }

  function handleClose() {
    if (busy) return;
    onClose();
  }

  async function submit() {
    if (!title.trim() || !image) {
      setError("Title and image are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adsApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        image,
        ...values,
      });
      reset();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create ad.");
      setBusy(false);
    }
  }

  const canSubmit = title.trim().length > 0 && image !== null && !busy;

  return (
    <Modal open={open} onClose={handleClose} title="Create ad" size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-(--text)">
            Image <span className="text-(--danger)">*</span>
          </label>
          <div className="mt-1.5 flex items-center gap-4">
            {preview ? (
              <img src={preview} alt="Ad preview" className="h-24 w-24 rounded-md border border-(--border) object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed border-(--border) text-xs text-(--text-subtle)">
                No image
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
              className="text-sm text-(--text-secondary) file:mr-3 file:rounded-md file:border-0 file:bg-(--surface-2) file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-(--text)"
            />
          </div>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-(--text)">
            Title <span className="text-(--danger)">*</span>
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text) outline-none transition-colors focus:border-(--accent)"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-(--text)">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-md border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text) outline-none transition-colors focus:border-(--accent)"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <label key={f.key} className="block space-y-1 text-sm">
              <span className="font-medium text-(--text)">{f.label}</span>
              <input
                type={f.type}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full rounded-md border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text) outline-none transition-colors focus:border-(--accent)"
              />
            </label>
          ))}
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-(--danger) bg-(--danger-soft) px-3 py-2 text-sm text-(--danger)">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-(--border-subtle) pt-4">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" disabled={!canSubmit} onClick={() => void submit()}>
            {busy ? "Creating…" : "Create Ad"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
