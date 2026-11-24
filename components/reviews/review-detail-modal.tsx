"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { TrashIcon } from "@/components/icons";
import { ApiError, mediaUrl } from "@/lib/api";
import { reviewTargetType, type AdminReview } from "@/lib/reviews";
import { usersApi, type AdminUser } from "@/lib/users";
import { tattoosApi, tattooCoverMedia, tattooGradientClass, placementLabel, type AdminTattooDetail } from "@/lib/tattoos";
import { Stars, MiniPerson, PersonSkeleton, targetTone } from "@/components/reviews/review-shared";

export function ReviewDetailModal({
  review,
  onClose,
  onDelete,
}: {
  review: AdminReview | null;
  onClose: () => void;
  onDelete: (r: AdminReview) => void;
}) {
  const [reviewer, setReviewer] = useState<AdminUser | null>(null);
  const [artist, setArtist] = useState<AdminUser | null>(null);
  const [tattoo, setTattoo] = useState<AdminTattooDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!review) {
      // setState runs only for the prop-driven reset — no render loop.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReviewer(null);
      setArtist(null);
      setTattoo(null);
      setError(null);
      return;
    }
    const type = reviewTargetType(review);
    setLoading(true);
    setError(null);
    Promise.allSettled([
      usersApi.get(review.userId),
      type === "artist" && review.artistId != null ? usersApi.get(review.artistId) : Promise.resolve(null),
      type === "tattoo" && review.tattooId != null ? tattoosApi.get(review.tattooId) : Promise.resolve(null),
    ])
      .then(([reviewerRes, artistRes, tattooRes]) => {
        setReviewer(reviewerRes.status === "fulfilled" ? reviewerRes.value : null);
        setArtist(artistRes.status === "fulfilled" ? artistRes.value : null);
        setTattoo(tattooRes.status === "fulfilled" ? tattooRes.value : null);

        const failures = [reviewerRes, artistRes, tattooRes].filter((r) => r.status === "rejected") as PromiseRejectedResult[];
        if (failures.length > 0) {
          const first = failures[0].reason;
          setError(
            first instanceof ApiError
              ? `Some details couldn't load: ${first.message}`
              : "Some details couldn't load — no response from the server.",
          );
        }
      })
      .finally(() => setLoading(false));
  }, [review]);

  if (!review) return null;
  const type = reviewTargetType(review);
  const cover = tattoo ? tattooCoverMedia(tattoo) : null;

  return (
    <Modal open={review !== null} onClose={onClose} title="Review details" size="lg">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-wide text-(--text-muted) uppercase">Reviewer</p>
          <Stars rating={review.rating} />
        </div>
        <MiniPerson
          user={reviewer}
          fallbackId={review.userId}
          size="lg"
          subtitle={reviewer ? [reviewer.role, reviewer.email].filter(Boolean).join(" · ") : undefined}
          loading={loading}
        />

        {error && (
          <p className="rounded-md border border-(--warning) bg-(--warning-soft) px-3 py-2 text-sm text-(--warning)">
            {error}
          </p>
        )}

        <div className="border-t border-(--border-subtle) pt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wide text-(--text-muted) uppercase">
              {type === "tattoo" ? "Tattoo reviewed" : "Artist reviewed"}
            </p>
            <Badge tone={targetTone[type]} className="capitalize">{type}</Badge>
          </div>

          {loading ? (
            <PersonSkeleton size="lg" />
          ) : type === "artist" ? (
            <MiniPerson
              user={artist}
              fallbackId={review.artistId ?? 0}
              size="lg"
              subtitle={artist ? [artist.role, artist.email].filter(Boolean).join(" · ") : "ARTIST"}
            />
          ) : tattoo || review.tattoo ? (
            <div className="flex items-center gap-3">
              {cover ? (
                <img
                  src={mediaUrl(cover.thumbnailUrl ?? cover.fileUrl) ?? undefined}
                  alt={tattoo?.title ?? review.tattoo?.title ?? ""}
                  className="h-11 w-11 shrink-0 rounded-md object-cover"
                />
              ) : (
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-linear-to-br text-sm font-bold text-white/90 ${tattooGradientClass(review.tattooId ?? review.id)}`}
                >
                  {(tattoo?.title ?? review.tattoo?.title ?? "T").charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-(--text)">
                  {tattoo?.title || review.tattoo?.title || `Tattoo #${review.tattooId}`}
                </p>
                <p className="truncate text-xs text-(--text-muted)">
                  {tattoo ? (placementLabel(tattoo.bodyPlacement) ?? "—") : "—"}
                  {tattoo?.author && ` · by ${`${tattoo.author.firstName ?? ""} ${tattoo.author.lastName ?? ""}`.trim() || `User #${tattoo.author.id}`}`}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-(--text-subtle)">Tattoo #{review.tattooId} — no further details available.</p>
          )}
        </div>

        {review.review && (
          <div className="border-t border-(--border-subtle) pt-4">
            <p className="mb-1.5 text-xs font-semibold tracking-wide text-(--text-muted) uppercase">Review</p>
            <p className="text-sm text-(--text-secondary) whitespace-pre-wrap">{review.review}</p>
          </div>
        )}

        {review.artistReply && (
          <div className="border-t border-(--border-subtle) pt-4">
            <p className="mb-1.5 text-xs font-semibold tracking-wide text-(--text-muted) uppercase">Artist reply</p>
            <p className="text-sm text-(--text-secondary) whitespace-pre-wrap">{review.artistReply}</p>
          </div>
        )}

        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 border-t border-(--border-subtle) pt-4 text-sm sm:grid-cols-2">
          <Detail label="Review ID" value={`#${review.id}`} />
          <Detail label="Target type" value={type === "tattoo" ? "Tattoo" : "Artist"} />
          <Detail label="Created" value={new Date(review.createdAt).toLocaleString()} />
          <Detail label="Updated" value={new Date(review.updatedAt).toLocaleString()} />
        </dl>

        <div className="flex justify-end gap-2 border-t border-(--border-subtle) pt-4">
          <Button variant="danger" size="sm" onClick={() => onDelete(review)}>
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
