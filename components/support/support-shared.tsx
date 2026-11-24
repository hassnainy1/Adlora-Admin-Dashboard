"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { mediaUrl } from "@/lib/api";
import { fullName, type AdminUser } from "@/lib/users";

/** Presentational pieces shared between the support list and the ticket detail modal. */

function initialsOf(first?: string | null, last?: string | null): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

const AVATAR_SIZE = { sm: "h-6 w-6 text-[10px]", lg: "h-11 w-11 text-sm" } as const;

export function UserCell({
  user,
  fallbackId,
  loading,
  size = "sm",
}: {
  user: AdminUser | null;
  fallbackId: number;
  loading: boolean;
  size?: keyof typeof AVATAR_SIZE;
}) {
  if (loading && !user) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className={`${AVATAR_SIZE[size]} shrink-0 rounded-full`} />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
    );
  }

  const name = user ? fullName(user) : `User #${fallbackId}`;
  const avatar = user ? mediaUrl(user.profileImageUrl) : null;

  return (
    <div className="flex items-center gap-2">
      {avatar ? (
        <img src={avatar} alt="" className={`${AVATAR_SIZE[size]} shrink-0 rounded-full object-cover`} />
      ) : (
        <span
          className={`flex ${AVATAR_SIZE[size]} shrink-0 items-center justify-center rounded-full bg-(--accent-soft) font-semibold text-(--accent)`}
        >
          {initialsOf(user?.firstName, user?.lastName)}
        </span>
      )}
      <span className="truncate text-(--text)">{name}</span>
    </div>
  );
}
