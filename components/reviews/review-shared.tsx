"use client";

import type { BadgeTone } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StarIcon } from "@/components/icons";
import { mediaUrl } from "@/lib/api";
import { reviewTargetType, type AdminReview, type ReviewTargetType } from "@/lib/reviews";
import { fullName, type AdminUser } from "@/lib/users";
import { tattooCoverMedia, tattooGradientClass, type AdminTattooDetail } from "@/lib/tattoos";

/**
 * Presentational pieces shared between the reviews list (reviews-manager.tsx)
 * and the review detail modal (review-detail-modal.tsx): star ratings,
 * avatars, and the reviewer/target "mini person" row.
 */

export const targetTone: Record<ReviewTargetType, BadgeTone> = {
  tattoo: "info",
  artist: "accent",
};

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon
          key={i}
          width={14}
          height={14}
          fill={i < rating ? "currentColor" : "none"}
          className={i < rating ? "text-(--accent)" : "text-(--text-subtle)"}
        />
      ))}
    </span>
  );
}

const AVATAR_SIZE = { sm: "h-8 w-8 text-xs", lg: "h-11 w-11 text-sm" } as const;

function initialsOf(first?: string | null, last?: string | null): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

function Avatar({
  src,
  initials,
  size = "sm",
  square = false,
}: {
  src?: string | null;
  initials: string;
  size?: keyof typeof AVATAR_SIZE;
  square?: boolean;
}) {
  const shape = square ? "rounded-md" : "rounded-full";
  if (src) {
    return <img src={src} alt="" className={`${AVATAR_SIZE[size]} shrink-0 ${shape} object-cover`} />;
  }
  return (
    <span
      className={`flex ${AVATAR_SIZE[size]} shrink-0 items-center justify-center ${shape} bg-(--accent-soft) font-semibold text-(--accent)`}
    >
      {initials}
    </span>
  );
}

/** Pulsing avatar+name placeholder shown while a row's user/tattoo lookup is still in flight. */
export function PersonSkeleton({ size = "sm" }: { size?: keyof typeof AVATAR_SIZE }) {
  return (
    <div className="flex items-center gap-2.5">
      <Skeleton className={`${AVATAR_SIZE[size]} shrink-0 rounded-full`} />
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-2.5 w-16 rounded" />
      </div>
    </div>
  );
}

/** Reviewer / target-artist cell — same shape used in the table (sm) and the detail modal (lg). */
export function MiniPerson({
  user,
  fallbackId,
  size = "sm",
  subtitle,
  loading = false,
}: {
  user: AdminUser | null;
  fallbackId: number;
  size?: keyof typeof AVATAR_SIZE;
  subtitle?: string;
  loading?: boolean;
}) {
  if (loading && !user) return <PersonSkeleton size={size} />;

  const name = user ? fullName(user) : `User #${fallbackId}`;
  const avatar = user ? mediaUrl(user.profileImageUrl) : null;

  return (
    <div className="flex items-center gap-2.5">
      <Avatar src={avatar} initials={initialsOf(user?.firstName, user?.lastName)} size={size} />
      <div className="min-w-0">
        <p className="truncate font-medium text-(--text)">{name}</p>
        {subtitle && <p className="truncate text-xs text-(--text-muted)">{subtitle}</p>}
        {user?.studioName && <p className="truncate text-xs text-(--text-subtle)">{user.studioName}</p>}
      </div>
    </div>
  );
}

/** Target cell for the reviews table — an artist's MiniPerson, or a tattoo's thumbnail+title. */
export function TargetCell({
  review,
  artist,
  tattoo,
  loading = false,
}: {
  review: AdminReview;
  artist: AdminUser | null;
  tattoo: AdminTattooDetail | null;
  loading?: boolean;
}) {
  const type = reviewTargetType(review);

  if (type === "artist") {
    return <MiniPerson user={artist} fallbackId={review.artistId ?? 0} subtitle="Artist" loading={loading} />;
  }

  if (loading && !tattoo) return <PersonSkeleton />;

  const cover = tattoo ? tattooCoverMedia(tattoo) : null;
  const thumb = mediaUrl(cover?.thumbnailUrl ?? cover?.fileUrl ?? review.tattoo?.thumbnailUrl);
  const label = tattoo?.title || review.tattoo?.title || `Tattoo #${review.tattooId}`;

  return (
    <div className="flex items-center gap-2.5">
      {thumb ? (
        <img src={thumb} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" />
      ) : (
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-linear-to-br text-xs font-bold text-white/90 ${tattooGradientClass(review.tattooId ?? review.id)}`}
        >
          {label.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate font-medium text-(--text)">{label}</p>
        <p className="truncate text-xs text-(--text-muted)">Tattoo</p>
      </div>
    </div>
  );
}
