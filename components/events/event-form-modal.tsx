"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { TrashIcon } from "@/components/icons";
import { ApiError, mediaUrl } from "@/lib/api";
import {
  eventsApi,
  EVENT_TYPES,
  EVENT_STATUSES,
  type Event,
  type EventType,
  type EventStatus,
  type EventMediaEdit,
} from "@/lib/events";
import { usersApi, fullName, type AdminUser } from "@/lib/users";

const TEXT_FIELDS: { key: keyof TextValues; label: string; type: string; required?: boolean }[] = [
  { key: "venue", label: "Venue", type: "text" },
  { key: "address", label: "Address", type: "text" },
  { key: "city", label: "City", type: "text" },
  { key: "state", label: "State", type: "text" },
  { key: "country", label: "Country", type: "text" },
  { key: "ticketPrice", label: "Ticket price", type: "number" },
  { key: "currency", label: "Currency", type: "text" },
  { key: "websiteUrl", label: "Website URL", type: "url" },
];

type TextValues = Record<
  "venue" | "address" | "city" | "state" | "country" | "ticketPrice" | "currency" | "websiteUrl",
  string
>;

const EMPTY_TEXT: TextValues = {
  venue: "",
  address: "",
  city: "",
  state: "",
  country: "",
  ticketPrice: "",
  currency: "",
  websiteUrl: "",
};

function toInputDateTime(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventFormModal({
  open,
  event,
  onClose,
  onSaved,
}: {
  open: boolean;
  event?: Event | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(event);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<EventType>(EVENT_TYPES[0]);
  const [status, setStatus] = useState<EventStatus>(EVENT_STATUSES[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [text, setText] = useState<TextValues>(EMPTY_TEXT);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [existingCover, setExistingCover] = useState<string | null>(null);

  const [artists, setArtists] = useState<{ artistId: string; boothNumber: string }[]>([]);
  const [guests, setGuests] = useState<{ name: string; designation: string; imageUrl: string }[]>([]);
  const [highlights, setHighlights] = useState<{ title: string }[]>([]);

  const [existingMedia, setExistingMedia] = useState<{ id: number; url: string; remove: boolean }[]>([]);
  const [newMedia, setNewMedia] = useState<File[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [artistOptions, setArtistOptions] = useState<AdminUser[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(false);
  const [artistsError, setArtistsError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // setState runs only after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setArtistsLoading(true);
    setArtistsError(null);
    usersApi
      .list("ARTIST")
      .then(setArtistOptions)
      .catch((err) => setArtistsError(err instanceof ApiError ? err.message : "Failed to load artists."))
      .finally(() => setArtistsLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    if (event) {
      // setState only runs when the `event` prop changes — no render loop.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(event.title);
      setDescription(event.description ?? "");
      setType(event.type);
      setStatus(event.status);
      setStartDate(toInputDateTime(event.startDate));
      setEndDate(toInputDateTime(event.endDate));
      setText({
        venue: event.venue ?? "",
        address: event.address ?? "",
        city: event.city ?? "",
        state: event.state ?? "",
        country: event.country ?? "",
        ticketPrice: event.ticketPrice != null ? String(event.ticketPrice) : "",
        currency: event.currency ?? "",
        websiteUrl: event.websiteUrl ?? "",
      });
      setExistingCover(event.coverImage ?? null);
      setArtists(event.artists.map((a) => ({ artistId: String(a.artistId), boothNumber: a.boothNumber ?? "" })));
      setGuests(event.guests.map((g) => ({ name: g.name, designation: g.designation ?? "", imageUrl: g.imageUrl ?? "" })));
      setHighlights(event.highlights.map((h) => ({ title: h.title })));
      setExistingMedia(event.media.map((m) => ({ id: m.id, url: m.thumbnailUrl ?? m.fileUrl, remove: false })));
    }
  }, [open, event]);

  useEffect(() => {
    if (!coverImage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCoverPreview(null);
      return;
    }
    const url = URL.createObjectURL(coverImage);
    setCoverPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [coverImage]);

  function reset() {
    setTitle("");
    setDescription("");
    setType(EVENT_TYPES[0]);
    setStatus(EVENT_STATUSES[0]);
    setStartDate("");
    setEndDate("");
    setText(EMPTY_TEXT);
    setCoverImage(null);
    setExistingCover(null);
    setArtists([]);
    setGuests([]);
    setHighlights([]);
    setExistingMedia([]);
    setNewMedia([]);
    setError(null);
    setBusy(false);
  }

  function handleClose() {
    if (busy) return;
    onClose();
  }

  function toggleMediaRemove(id: number) {
    setExistingMedia((prev) => prev.map((m) => (m.id === id ? { ...m, remove: !m.remove } : m)));
  }

  async function submit() {
    if (!title.trim() || !startDate || !endDate) {
      setError("Title, start date and end date are required.");
      return;
    }
    setBusy(true);
    setError(null);

    const media: EventMediaEdit[] = [
      ...existingMedia.filter((m) => m.remove).map((m) => ({ id: m.id })),
      ...newMedia.map((file) => ({ file })),
    ];

    const fields = {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      status,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      venue: text.venue || undefined,
      address: text.address || undefined,
      city: text.city || undefined,
      state: text.state || undefined,
      country: text.country || undefined,
      ticketPrice: text.ticketPrice ? Number(text.ticketPrice) : undefined,
      currency: text.currency || undefined,
      websiteUrl: text.websiteUrl || undefined,
      coverImage: coverImage ?? undefined,
      artists: artists
        .filter((a) => a.artistId.trim())
        .map((a) => ({ artistId: Number(a.artistId), boothNumber: a.boothNumber || undefined })),
      guests: guests
        .filter((g) => g.name.trim())
        .map((g) => ({ name: g.name.trim(), designation: g.designation || undefined, imageUrl: g.imageUrl || undefined })),
      highlights: highlights.filter((h) => h.title.trim()).map((h) => ({ title: h.title.trim() })),
      media: media.length > 0 ? media : undefined,
    };

    try {
      if (isEdit && event) {
        await eventsApi.update(event.id, fields);
      } else {
        await eventsApi.create(fields);
      }
      reset();
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to ${isEdit ? "update" : "create"} event.`);
      setBusy(false);
    }
  }

  const canSubmit = title.trim().length > 0 && startDate !== "" && endDate !== "" && !busy;
  const inputClass =
    "w-full rounded-md border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text) outline-none transition-colors focus:border-(--accent)";
  const labelClass = "block space-y-1 text-sm";

  return (
    <Modal open={open} onClose={handleClose} title={isEdit ? "Edit event" : "Create event"} size="lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-(--text)">Cover image</label>
          <div className="mt-1.5 flex items-center gap-4">
            {coverPreview ?? mediaUrl(existingCover) ? (
              <img
                src={coverPreview ?? mediaUrl(existingCover) ?? undefined}
                alt="Cover preview"
                className="h-24 w-24 rounded-md border border-(--border) object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed border-(--border) text-xs text-(--text-subtle)">
                No image
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
              className="text-sm text-(--text-secondary) file:mr-3 file:rounded-md file:border-0 file:bg-(--surface-2) file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-(--text)"
            />
          </div>
        </div>

        <label className={labelClass}>
          <span className="font-medium text-(--text)">
            Title <span className="text-(--danger)">*</span>
          </span>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </label>

        <label className={labelClass}>
          <span className="font-medium text-(--text)">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            <span className="font-medium text-(--text)">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as EventType)} className={inputClass}>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className="font-medium text-(--text)">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as EventStatus)} className={inputClass}>
              {EVENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className="font-medium text-(--text)">
              Start date <span className="text-(--danger)">*</span>
            </span>
            <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className="font-medium text-(--text)">
              End date <span className="text-(--danger)">*</span>
            </span>
            <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TEXT_FIELDS.map((f) => (
            <label key={f.key} className={labelClass}>
              <span className="font-medium text-(--text)">{f.label}</span>
              <input
                type={f.type}
                value={text[f.key]}
                onChange={(e) => setText((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className={inputClass}
              />
            </label>
          ))}
        </div>

        <div className="space-y-1.5 border-t border-(--border-subtle) pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-(--text)">Artists</span>
            {artistsLoading && <span className="text-xs text-(--text-subtle)">Loading artists…</span>}
          </div>
          {artistsError && (
            <p className="rounded-md border border-(--warning) bg-(--warning-soft) px-3 py-2 text-sm text-(--warning)">
              {artistsError}
            </p>
          )}
          <RepeatableSection
            title="Artists"
            hideHeading
            items={artists}
            onAdd={() => setArtists((prev) => [...prev, { artistId: "", boothNumber: "" }])}
            onRemove={(i) => setArtists((prev) => prev.filter((_, idx) => idx !== i))}
            render={(item, i) => {
              // If editing an event whose saved artist isn't in the fetched list
              // (e.g. inactive/deleted since), keep it selectable by id.
              const options: { id: number; firstName: string; lastName: string; studioName?: string | null }[] =
                item.artistId && !artistOptions.some((a) => String(a.id) === item.artistId)
                  ? [{ id: Number(item.artistId), firstName: `Artist #${item.artistId}`, lastName: "" }, ...artistOptions]
                  : artistOptions;
              return (
                <div className="grid flex-1 grid-cols-2 gap-2">
                  <select
                    value={item.artistId}
                    onChange={(e) => setArtists((prev) => prev.map((a, idx) => (idx === i ? { ...a, artistId: e.target.value } : a)))}
                    className={inputClass}
                  >
                    <option value="">Select artist…</option>
                    {options.map((a) => (
                      <option key={a.id} value={a.id}>
                        {fullName(a)}
                        {a.studioName ? ` — ${a.studioName}` : ""}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Booth number"
                    value={item.boothNumber}
                    onChange={(e) => setArtists((prev) => prev.map((a, idx) => (idx === i ? { ...a, boothNumber: e.target.value } : a)))}
                    className={inputClass}
                  />
                </div>
              );
            }}
          />
        </div>

        <RepeatableSection
          title="Guests"
          items={guests}
          onAdd={() => setGuests((prev) => [...prev, { name: "", designation: "", imageUrl: "" }])}
          onRemove={(i) => setGuests((prev) => prev.filter((_, idx) => idx !== i))}
          render={(item, i) => (
            <div className="grid flex-1 grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Name"
                value={item.name}
                onChange={(e) => setGuests((prev) => prev.map((g, idx) => (idx === i ? { ...g, name: e.target.value } : g)))}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Designation"
                value={item.designation}
                onChange={(e) => setGuests((prev) => prev.map((g, idx) => (idx === i ? { ...g, designation: e.target.value } : g)))}
                className={inputClass}
              />
              <input
                type="url"
                placeholder="Image URL"
                value={item.imageUrl}
                onChange={(e) => setGuests((prev) => prev.map((g, idx) => (idx === i ? { ...g, imageUrl: e.target.value } : g)))}
                className={inputClass}
              />
            </div>
          )}
        />

        <RepeatableSection
          title="Highlights"
          items={highlights}
          onAdd={() => setHighlights((prev) => [...prev, { title: "" }])}
          onRemove={(i) => setHighlights((prev) => prev.filter((_, idx) => idx !== i))}
          render={(item, i) => (
            <input
              type="text"
              placeholder="Highlight"
              value={item.title}
              onChange={(e) => setHighlights((prev) => prev.map((h, idx) => (idx === i ? { title: e.target.value } : h)))}
              className={`${inputClass} flex-1`}
            />
          )}
        />

        {(existingMedia.length > 0 || isEdit) && (
          <div>
            <label className="block text-sm font-medium text-(--text)">Media</label>
            {existingMedia.length > 0 && (
              <div className="mt-1.5 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {existingMedia.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMediaRemove(m.id)}
                    title={m.remove ? "Click to keep" : "Click to remove"}
                    className="relative aspect-square overflow-hidden rounded-md border border-(--border)"
                  >
                    <img src={mediaUrl(m.url) ?? undefined} alt="" className="h-full w-full object-cover" />
                    {m.remove && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-[10px] font-semibold text-white">
                        REMOVE
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(e) => setNewMedia(Array.from(e.target.files ?? []))}
              className="mt-2 text-sm text-(--text-secondary) file:mr-3 file:rounded-md file:border-0 file:bg-(--surface-2) file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-(--text)"
            />
          </div>
        )}

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
            {busy ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save changes" : "Create Event"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function RepeatableSection<T>({
  title,
  items,
  onAdd,
  onRemove,
  render,
  hideHeading = false,
}: {
  title: string;
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  render: (item: T, index: number) => React.ReactNode;
  /** Skip the section wrapper's own border/heading — used when a parent already renders one. */
  hideHeading?: boolean;
}) {
  return (
    <div className={hideHeading ? "space-y-2" : "space-y-2 border-t border-(--border-subtle) pt-4"}>
      <div className="flex items-center justify-between">
        {!hideHeading && <span className="text-sm font-medium text-(--text)">{title}</span>}
        <Button type="button" variant="secondary" size="sm" onClick={onAdd} className={hideHeading ? "ml-auto" : undefined}>
          Add
        </Button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          {render(item, i)}
          <button
            type="button"
            onClick={() => onRemove(i)}
            aria-label={`Remove ${title.toLowerCase()} row`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-(--text-muted) transition-colors hover:bg-(--danger-soft) hover:text-(--danger)"
          >
            <TrashIcon width={14} height={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
