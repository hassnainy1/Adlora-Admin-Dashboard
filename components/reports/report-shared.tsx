"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { mediaUrl } from "@/lib/api";
import { reporterName, type AdminReport } from "@/lib/reports";
import { fullName, type AdminUser } from "@/lib/users";
import { tattooCoverMedia, tattooGradientClass, type AdminTattooDetail } from "@/lib/tattoos";
import { reviewerName, type AdminReview } from "@/lib/reviews";

/** Presentational pieces shared between the reports list and the report detail modal. */

const AVATAR_SIZE = { sm: "h-8 w-8 text-xs", lg: "h-11 w-11 text-sm" } as const;

function initialsOf(first?: string | null, last?: string | null): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

function Avatar({
  src,
  initials,
  size = "sm",
}: {
  src?: string | null;
  initials: string;
  size?: keyof typeof AVATAR_SIZE;
}) {
  if (src) {
    return <img src={src} alt="" className={`${AVATAR_SIZE[size]} shrink-0 rounded-full object-cover`} />;
  }
  return (
    <span
      className={`flex ${AVATAR_SIZE[size]} shrink-0 items-center justify-center rounded-full bg-(--accent-soft) font-semibold text-(--accent)`}
    >
      {initials}
    </span>
  );
}

/** Pulsing avatar+name placeholder shown while a target user lookup is still in flight. */
export function PersonSkeleton({ size = "sm" }: { size?: keyof typeof AVATAR_SIZE }) {
  return (
    <div className="flex items-center gap-2.5">
      <Skeleton className={`${AVATAR_SIZE[size]} shrink-0 rounded-full`} />
      <Skeleton className="h-3 w-24 rounded" />
    </div>
  );
}

/** Reporter avatar + name cell — used in the table (sm) and the detail modal (lg). */
export function ReporterCell({
  report,
  size = "sm",
}: {
  report: AdminReport;
  size?: keyof typeof AVATAR_SIZE;
}) {
  const profile = report.reporter?.profile;
  const name = reporterName(report);
  const avatar = mediaUrl(profile?.profileImageUrl);

  return (
    <div className="flex items-center gap-2.5">
      <Avatar src={avatar} initials={initialsOf(profile?.firstName, profile?.lastName)} size={size} />
      <p className="truncate font-medium text-(--text)">{name}</p>
    </div>
  );
}

/**
 * Reported target cell. The reported entity (tattoo/review/user) isn't
 * embedded in the report itself, so the caller resolves it separately and
 * passes down the fetched user (USER), tattoo (TATTOO), or a display label
 * (REVIEW) — this only ever renders a name/thumbnail, never a raw id.
 * USER links through to the user detail page; TATTOO links to the tattoo's
 * card, which opens straight to that tattoo's detail view.
 */
export function TargetCell({
  report,
  targetUser,
  targetTattoo,
  targetReview,
  loading = false,
}: {
  report: AdminReport;
  targetUser: AdminUser | null;
  targetTattoo?: AdminTattooDetail | null;
  targetReview?: AdminReview | null;
  loading?: boolean;
}) {
  if (report.reportableType === "USER") {
    if (loading && !targetUser) return <PersonSkeleton />;
    const name = targetUser ? fullName(targetUser) : `User #${report.reportableId}`;
    const avatar = targetUser ? mediaUrl(targetUser.profileImageUrl) : null;
    return (
      <Link href={`/users/${report.reportableId}`} className="group/target flex items-center gap-2.5">
        <Avatar src={avatar} initials={initialsOf(targetUser?.firstName, targetUser?.lastName)} />
        <p className="truncate font-medium text-(--text) group-hover/target:text-(--accent)">{name}</p>
      </Link>
    );
  }

  if (report.reportableType === "TATTOO") {
    if (loading && !targetTattoo) {
      return (
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-11 w-11 shrink-0 rounded-md" />
          <Skeleton className="h-3 w-32 rounded" />
        </div>
      );
    }
    const title = targetTattoo?.title || `Tattoo #${report.reportableId}`;
    const cover = targetTattoo ? tattooCoverMedia(targetTattoo) : null;
    const image = cover ? mediaUrl(cover.thumbnailUrl ?? cover.fileUrl) : null;
    return (
      <Link href={`/tattoos?tattooId=${report.reportableId}`} className="group/target flex items-center gap-2.5">
        {image ? (
          <img src={image} alt="" className="h-11 w-11 shrink-0 rounded-md object-cover" />
        ) : (
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-linear-to-br text-sm font-bold text-white/90 ${tattooGradientClass(report.reportableId)}`}
          >
            {title.charAt(0).toUpperCase()}
          </span>
        )}
        <p className="truncate font-medium text-(--text) group-hover/target:text-(--accent)">{title}</p>
      </Link>
    );
  }

  // REVIEW
  if (loading && !targetReview) return <PersonSkeleton />;

  const reviewerFullName = targetReview ? reviewerName(targetReview) : null;
  const name = reviewerFullName && !reviewerFullName.startsWith("User #") ? reviewerFullName : "Review";
  const avatar = targetReview?.user ? mediaUrl(targetReview.user.profileImageUrl) : null;
  const subtitle = targetReview ? reviewTargetSubtitle(targetReview) : null;

  return (
    <Link href={`/reviews?reviewId=${report.reportableId}`} className="group/target flex items-center gap-2.5">
      <Avatar src={avatar} initials={initialsOf(targetReview?.user?.firstName, targetReview?.user?.lastName)} />
      <div className="min-w-0">
        <p className="truncate font-medium text-(--text) group-hover/target:text-(--accent)">{name}</p>
        {subtitle && <p className="truncate text-xs text-(--text-muted)">on {subtitle}</p>}
      </div>
    </Link>
  );
}

/** Like reviewTargetLabel, but never falls back to a raw id — omits the subtitle entirely instead. */
function reviewTargetSubtitle(r: AdminReview): string | null {
  if (r.tattooId != null) return r.tattoo?.title?.trim() || null;
  const a = r.artist;
  const artistName = a ? `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim() || a.studioName : null;
  return artistName || null;
}
