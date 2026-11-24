"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ApiError, mediaUrl } from "@/lib/api";
import {
  tattoosApi,
  tattooOwnerName,
  tattooCoverMedia,
  tattooGradientClass,
  placementLabel,
  type AdminTattoo,
  type AdminTattooDetail,
  type ModerateAction,
  type TattooStatus,
} from "@/lib/tattoos";
import { cn } from "@/lib/cn";
import { statusTone } from "@/components/tattoos/tattoo-status";
import { ModerationActions } from "@/components/tattoos/moderation-actions";

export function TattooDetailModal({
  tattoo,
  friendlyStatus,
  busy,
  onClose,
  onAction,
}: {
  tattoo: AdminTattoo | null;
  friendlyStatus: TattooStatus;
  busy: boolean;
  onClose: () => void;
  onAction: (action: ModerateAction, label: string) => void;
}) {
  const [detail, setDetail] = useState<AdminTattooDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tattoo) {
      // setState runs only for the prop-driven reset — no render loop.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDetail(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    tattoosApi
      .get(tattoo.id)
      .then(setDetail)
      .catch((err) =>
        setError(
          err instanceof ApiError && err.status === 404
            ? "This tattoo is private — full details aren't visible, but the summary below is up to date."
            : err instanceof ApiError
              ? err.message
              : "Failed to load tattoo details.",
        ),
      )
      .finally(() => setLoading(false));
  }, [tattoo]);

  if (!tattoo) return null;

  // Fall back to the row's summary data (already shaped like AdminTattoo) if the full fetch failed.
  const data: AdminTattoo = detail ?? tattoo;
  const cover = tattooCoverMedia(data);

  return (
    <Modal open={tattoo !== null} onClose={onClose} title={data.title || `Tattoo #${data.id}`} size="lg">
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-48 rounded-md bg-(--surface-2)" />
          <div className="h-4 w-40 rounded bg-(--surface-2)" />
          <div className="h-20 rounded bg-(--surface-2)" />
        </div>
      ) : (
        <div className="space-y-5">
          {error && (
            <p className="rounded-md border border-(--warning) bg-(--warning-soft) px-3 py-2 text-sm text-(--warning)">
              {error}
            </p>
          )}

          {data.media.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {data.media.map((m) => (
                <img
                  key={m.id}
                  src={mediaUrl(m.thumbnailUrl ?? m.fileUrl) ?? undefined}
                  alt={data.title ?? `Tattoo #${data.id}`}
                  className="aspect-square w-full rounded-md border border-(--border) object-cover"
                />
              ))}
            </div>
          ) : cover ? null : (
            <div className={cn("flex h-40 items-center justify-center rounded-md bg-linear-to-br text-3xl font-bold text-white/90", tattooGradientClass(data.id))}>
              {(data.title?.charAt(0) ?? "?").toUpperCase()}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={statusTone[friendlyStatus]}>{friendlyStatus}</Badge>
            <Badge tone="neutral">{data.privacy.replaceAll("_", " ").toLowerCase()}</Badge>
            {data.isMemory && <Badge tone="accent">memory</Badge>}
          </div>

          {data.description && <p className="text-sm text-(--text-secondary)">{data.description}</p>}

          <div className="flex items-center gap-3 border-t border-(--border-subtle) pt-4">
            {data.author?.profileImageUrl ? (
              <img
                src={mediaUrl(data.author.profileImageUrl) ?? undefined}
                alt={tattooOwnerName(data)}
                className="h-11 w-11 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--accent-soft) text-sm font-semibold text-(--accent)">
                {tattooOwnerName(data).charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-(--text)">{tattooOwnerName(data)}</p>
              <p className="truncate text-xs text-(--text-muted)">
                {data.author?.role ?? "USER"}
                {data.author?.averageRating != null && ` · ★ ${data.author.averageRating.toFixed(1)} (${data.author.reviewCount})`}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Detail label="Placement" value={placementLabel(data.bodyPlacement) ?? "—"} />
            <Detail label="Styles" value={data.styles.map((s) => s.name).join(", ") || "—"} />
            <Detail label="Category" value={data.category?.name ?? "—"} />
            <Detail label="Tags" value={data.tags.map((t) => t.name).join(", ") || "—"} />
            <Detail label="Likes" value={data.likeCount.toLocaleString()} />
            <Detail label="Comments" value={data.commentCount.toLocaleString()} />
            <Detail label="Views" value={data.viewCount.toLocaleString()} />
            <Detail label="Shares" value={data.shareCount.toLocaleString()} />
            <Detail label="Created" value={new Date(data.createdAt).toLocaleString()} />
            {data.tattooDate && <Detail label="Tattoo date" value={new Date(data.tattooDate).toLocaleDateString()} />}
          </dl>

          <div className="flex flex-wrap gap-2 border-t border-(--border-subtle) pt-4">
            <ModerationActions status={friendlyStatus} busy={busy} onAction={onAction} />
          </div>
        </div>
      )}
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
