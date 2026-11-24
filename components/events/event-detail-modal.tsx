"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { CheckIcon, FlagIcon, TrashIcon, StarIcon, UserIcon } from "@/components/icons";
import { ApiError, mediaUrl } from "@/lib/api";
import {
  eventsApi,
  creatorName,
  eventLocation,
  APPROVAL_STATUS_TONE,
  EVENT_STATUS_TONE,
  type Event,
  type EventAttendee,
  type EventFollower,
} from "@/lib/events";
import { usersApi, fullName, type AdminUser } from "@/lib/users";

type Tab = "overview" | "media" | "artists" | "people";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "media", label: "Media" },
  { id: "artists", label: "Artists" },
  { id: "people", label: "People" },
];

export function EventDetailModal({
  eventId,
  onClose,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  onToggleFeatured,
  busy,
}: {
  eventId: number | null;
  onClose: () => void;
  onApprove: (event: Event) => void;
  onReject: (event: Event) => void;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  onToggleFeatured: (event: Event) => void;
  busy: boolean;
}) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (eventId === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEvent(null);
      setTab("overview");
      return;
    }
    setLoading(true);
    setError(null);
    eventsApi
      .get(eventId)
      .then(setEvent)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load event."))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (eventId === null) return null;

  return (
    <Modal open={eventId !== null} onClose={onClose} title={event?.title ?? "Event"} size="lg">
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-48 rounded-md bg-(--surface-2)" />
          <div className="h-4 w-40 rounded bg-(--surface-2)" />
          <div className="h-20 rounded bg-(--surface-2)" />
        </div>
      ) : error ? (
        <p role="alert" className="rounded-md border border-(--danger) bg-(--danger-soft) px-3 py-2 text-sm text-(--danger)">
          {error}
        </p>
      ) : event ? (
        <div className="space-y-4">
          {event.coverImage && (
            <img
              src={mediaUrl(event.coverImage) ?? undefined}
              alt={event.title}
              className="h-48 w-full rounded-md border border-(--border) object-cover"
            />
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={APPROVAL_STATUS_TONE[event.approvalStatus]}>{event.approvalStatus}</Badge>
            <Badge tone={EVENT_STATUS_TONE[event.status]}>{event.status}</Badge>
            <Badge tone="neutral">{event.type}</Badge>
            {event.isFeatured && <Badge tone="accent">Featured</Badge>}
          </div>

          {event.approvalStatus === "REJECTED" && event.rejectionReason && (
            <p className="rounded-md border border-(--danger) bg-(--danger-soft) px-3 py-2 text-sm text-(--danger)">
              Rejection reason: {event.rejectionReason}
            </p>
          )}

          <div className="grid grid-cols-4 gap-1 rounded-md border border-(--border) bg-(--surface) p-1 sm:flex sm:items-center sm:overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`shrink-0 rounded px-2 py-1.5 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs ${
                  tab === t.id
                    ? "bg-(--accent) text-(--accent-foreground)"
                    : "text-(--text-muted) hover:bg-(--surface-2) hover:text-(--text)"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "overview" && <OverviewTab event={event} />}
          {tab === "media" && <MediaTab event={event} />}
          {tab === "artists" && <ArtistsGuestsTab event={event} />}
          {tab === "people" && <PeopleTab eventId={event.id} />}

          <div className="flex flex-wrap gap-2 border-t border-(--border-subtle) pt-4">
            {event.approvalStatus === "PENDING" && (
              <>
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => onApprove(event)}>
                  <CheckIcon width={14} height={14} /> Approve
                </Button>
                <Button size="sm" variant="danger" disabled={busy} onClick={() => onReject(event)}>
                  <FlagIcon width={14} height={14} /> Reject
                </Button>
              </>
            )}
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => onToggleFeatured(event)}>
              <StarIcon width={14} height={14} /> {event.isFeatured ? "Unfeature" : "Feature"}
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => onEdit(event)}>
              Edit
            </Button>
            <Button size="sm" variant="danger" disabled={busy} onClick={() => onDelete(event)}>
              <TrashIcon width={14} height={14} /> Delete
            </Button>
          </div>
        </div>
      ) : null}
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

function OverviewTab({ event }: { event: Event }) {
  const [fetchedCreator, setFetchedCreator] = useState<AdminUser | null>(null);
  // The event's embedded `createdBy` sometimes has empty first/last name —
  // when that happens, fetch the full artist record by id instead of showing "Unknown".
  const embeddedIncomplete = !event.createdBy?.firstName;
  const creatorId = event.createdBy?.id;

  useEffect(() => {
    if (!embeddedIncomplete || creatorId == null) {
      // setState runs only for the prop-driven reset — no render loop.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFetchedCreator(null);
      return;
    }
    usersApi.get(creatorId).then(setFetchedCreator).catch(() => {});
  }, [embeddedIncomplete, creatorId]);

  const creatorLoading = embeddedIncomplete && creatorId != null && !fetchedCreator;
  const displayName = !embeddedIncomplete
    ? creatorName(event.createdBy)
    : fetchedCreator
      ? fullName(fetchedCreator)
      : creatorId != null
        ? `Artist #${creatorId}`
        : "Unknown";
  const studioName = event.createdBy?.studioName ?? fetchedCreator?.studioName ?? null;
  const avatar = mediaUrl(fetchedCreator?.profileImageUrl ?? null);

  return (
    <div className="space-y-4">
      {event.description && <p className="text-sm text-(--text-secondary)">{event.description}</p>}

      <div className="flex items-center gap-3 border-t border-(--border-subtle) pt-4">
        {creatorLoading ? (
          <>
            <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-(--surface-2)" />
            <div className="min-w-0 space-y-1.5">
              <div className="h-3.5 w-32 animate-pulse rounded bg-(--surface-2)" />
              <div className="h-3 w-20 animate-pulse rounded bg-(--surface-2)" />
            </div>
          </>
        ) : (
          <>
            {avatar ? (
              <img src={avatar} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--accent-soft) text-sm font-semibold text-(--accent)">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-(--text)">{displayName}</p>
              {studioName && <p className="truncate text-xs text-(--text-muted)">{studioName}</p>}
            </div>
          </>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <Detail label="Starts" value={new Date(event.startDate).toLocaleString()} />
        <Detail label="Ends" value={new Date(event.endDate).toLocaleString()} />
        <Detail label="Venue" value={event.venue ?? "—"} />
        <Detail label="Location" value={eventLocation(event)} />
        <Detail label="Address" value={event.address ?? "—"} />
        <Detail
          label="Ticket price"
          value={event.ticketPrice != null ? `${event.currency ?? ""} ${event.ticketPrice}`.trim() : "Free"}
        />
        {event.websiteUrl && <Detail label="Website" value={event.websiteUrl} />}
      </dl>
    </div>
  );
}

function MediaTab({ event }: { event: Event }) {
  if (event.media.length === 0) {
    return <p className="py-6 text-center text-sm text-(--text-muted)">No media uploaded.</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {event.media.map((m) => (
        <img
          key={m.id}
          src={mediaUrl(m.thumbnailUrl ?? m.fileUrl) ?? undefined}
          alt={event.title}
          className="aspect-square w-full rounded-md border border-(--border) object-cover"
        />
      ))}
    </div>
  );
}

function ArtistsGuestsTab({ event }: { event: Event }) {
  const [artistCache, setArtistCache] = useState<Map<number, AdminUser>>(new Map());

  useEffect(() => {
    // The embedded `artist` on each entry sometimes has empty first/last name
    // — fetch those by id instead of ever rendering "undefined undefined".
    const missingIds = event.artists
      .filter((a) => !a.artist?.firstName)
      .map((a) => a.artistId)
      .filter((id) => !artistCache.has(id));
    if (missingIds.length === 0) return;
    Promise.allSettled(missingIds.map((id) => usersApi.get(id).then((u) => [id, u] as const))).then((results) => {
      setArtistCache((prev) => {
        const next = new Map(prev);
        for (const r of results) {
          if (r.status === "fulfilled") next.set(r.value[0], r.value[1]);
        }
        return next;
      });
    });
    // Re-runs only when the event's artist list itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.artists]);

  return (
    <div className="space-y-5">
      <div>
        <h4 className="mb-2 text-xs font-semibold tracking-wide text-(--text-muted) uppercase">Artists</h4>
        {event.artists.length === 0 ? (
          <p className="text-sm text-(--text-muted)">No artists listed.</p>
        ) : (
          <ul className="space-y-1.5">
            {event.artists.map((a) => {
              const embeddedOk = Boolean(a.artist?.firstName);
              const fetched = artistCache.get(a.artistId) ?? null;
              const loading = !embeddedOk && !fetched;
              const name = embeddedOk
                ? `${a.artist?.firstName ?? ""} ${a.artist?.lastName ?? ""}`.trim()
                : fetched
                  ? fullName(fetched)
                  : null;
              const studio = a.artist?.studioName ?? fetched?.studioName ?? null;

              return (
                <li key={a.artistId} className="flex items-center justify-between rounded-md border border-(--border-subtle) px-3 py-2 text-sm">
                  {loading ? (
                    <div className="h-4 w-32 animate-pulse rounded bg-(--surface-2)" />
                  ) : (
                    <span className="text-(--text)">
                      {name || `Artist #${a.artistId}`}
                      {studio && <span className="text-(--text-muted)"> · {studio}</span>}
                    </span>
                  )}
                  {a.boothNumber && <span className="text-(--text-subtle)">Booth {a.boothNumber}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold tracking-wide text-(--text-muted) uppercase">Guests</h4>
        {event.guests.length === 0 ? (
          <p className="text-sm text-(--text-muted)">No guests listed.</p>
        ) : (
          <ul className="space-y-1.5">
            {event.guests.map((g, i) => (
              <li key={i} className="flex items-center gap-3 rounded-md border border-(--border-subtle) px-3 py-2 text-sm">
                {g.imageUrl ? (
                  <img src={mediaUrl(g.imageUrl) ?? undefined} alt={g.name} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--surface-2) text-(--text-subtle)">
                    <UserIcon width={14} height={14} />
                  </span>
                )}
                <span className="text-(--text)">{g.name}</span>
                {g.designation && <span className="text-(--text-subtle)">· {g.designation}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {event.highlights.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-(--text-muted) uppercase">Highlights</h4>
          <ul className="list-inside list-disc space-y-1 text-sm text-(--text-secondary)">
            {event.highlights.map((h, i) => (
              <li key={i}>{h.title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

type PersonSource = { userId?: number; user?: { id: number; firstName: string; lastName: string; email: string; profileImageUrl: string | null } | null };

/** Best available id for a row: the embedded user's id, else the flat `userId`, else null. */
function personId(row: PersonSource): number | null {
  return row.user?.id ?? row.userId ?? null;
}

/** True once the embedded `user` has everything needed to render — no fetch needed. */
function hasCompleteUser(row: PersonSource): boolean {
  return Boolean(row.user?.firstName);
}

function PersonRow({
  id,
  embedded,
  fetched,
  loading,
  trailing,
}: {
  id: number | null;
  embedded?: PersonSource["user"];
  fetched?: AdminUser | null;
  loading: boolean;
  trailing?: ReactNode;
}) {
  if (loading && !embedded && !fetched) {
    return (
      <li className="flex items-center gap-3 rounded-md border border-(--border-subtle) px-3 py-2">
        <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-(--surface-2)" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-3 w-24 animate-pulse rounded bg-(--surface-2)" />
          <div className="h-2.5 w-32 animate-pulse rounded bg-(--surface-2)" />
        </div>
      </li>
    );
  }

  const name = embedded
    ? `${embedded.firstName} ${embedded.lastName}`.trim()
    : fetched
      ? fullName(fetched)
      : null;
  const email = embedded?.email ?? fetched?.email ?? null;
  const avatar = mediaUrl(embedded?.profileImageUrl ?? fetched?.profileImageUrl ?? null);
  const initials = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <li className="flex items-center gap-3 rounded-md border border-(--border-subtle) px-3 py-2 text-sm">
      {avatar ? (
        <img src={avatar} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--accent-soft) text-xs font-semibold text-(--accent)">
          {initials}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-(--text)">{name ?? (id != null ? `User #${id}` : "Unknown user")}</p>
        {email && <p className="truncate text-xs text-(--text-subtle)">{email}</p>}
      </div>
      {trailing}
    </li>
  );
}

type PeopleMode = "attendees" | "followers";

function PeopleTab({ eventId }: { eventId: number }) {
  const [mode, setMode] = useState<PeopleMode>("attendees");
  const [attendees, setAttendees] = useState<EventAttendee[] | null>(null);
  const [followers, setFollowers] = useState<EventFollower[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userCache, setUserCache] = useState<Map<number, AdminUser>>(new Map());

  useEffect(() => {
    // setState only runs for the prop-driven reset — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAttendees(null);
    setFollowers(null);
    setUserCache(new Map());
    setError(null);
  }, [eventId]);

  useEffect(() => {
    if (mode === "attendees" && attendees !== null) return;
    if (mode === "followers" && followers !== null) return;
    // setState runs only after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null);
    const request = mode === "attendees" ? eventsApi.attendees(eventId) : eventsApi.followers(eventId);
    request
      .then((res) => {
        if (mode === "attendees") setAttendees(res.data as EventAttendee[]);
        else setFollowers(res.data as EventFollower[]);

        // Backfill anything the list didn't embed a full user for, using
        // whatever id is available — never render a raw "undefined".
        const rows = res.data as PersonSource[];
        const missingIds = rows
          .filter((r) => !hasCompleteUser(r))
          .map(personId)
          .filter((id): id is number => id != null && !userCache.has(id));
        if (missingIds.length === 0) return;
        Promise.allSettled(missingIds.map((id) => usersApi.get(id).then((u) => [id, u] as const))).then((results) => {
          setUserCache((prev) => {
            const next = new Map(prev);
            for (const r of results) {
              if (r.status === "fulfilled") next.set(r.value[0], r.value[1]);
            }
            return next;
          });
        });
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : `Failed to load ${mode === "attendees" ? "attendees" : "followers"}.`),
      );
    // Re-runs only when the mode or the loaded-state for that mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, mode, attendees, followers]);

  const rows = mode === "attendees" ? attendees : followers;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 rounded-md border border-(--border) bg-(--surface) p-1">
        {(["attendees", "followers"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === m
                ? "bg-(--accent) text-(--accent-foreground)"
                : "text-(--text-muted) hover:bg-(--surface-2) hover:text-(--text)"
            }`}
          >
            {m === "attendees" ? "Going" : "Following"}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-(--danger)">
          {error}
        </p>
      ) : rows === null ? (
        <ul className="space-y-1.5">
          {Array.from({ length: 3 }, (_, i) => (
            <PersonRow key={i} id={null} loading />
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-(--text-muted)">
          {mode === "attendees" ? "No RSVPs yet." : "No followers yet."}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => {
            const id = personId(r);
            const complete = hasCompleteUser(r);
            return (
              <PersonRow
                key={r.id}
                id={id}
                embedded={complete ? r.user : null}
                fetched={id != null ? (userCache.get(id) ?? null) : null}
                loading={!complete && id != null && !userCache.has(id)}
                trailing={mode === "attendees" ? <Badge tone="neutral">{(r as EventAttendee).status}</Badge> : undefined}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
