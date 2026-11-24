"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { useToasts, ToastViewport } from "@/components/ui/toast";
import { StarIcon } from "@/components/icons";
import { ApiError } from "@/lib/api";
import type { Pagination } from "@/lib/api";
import { reviewsApi, reviewerName, reviewTargetLabel, type AdminReview } from "@/lib/reviews";
import { usersApi, type AdminUser } from "@/lib/users";
import { tattoosApi, type AdminTattoo, type AdminTattooDetail } from "@/lib/tattoos";
import { Stars, MiniPerson, TargetCell } from "@/components/reviews/review-shared";
import { PersonSearchInput } from "@/components/reviews/person-search-input";
import { TattooSearchInput } from "@/components/reviews/tattoo-search-input";
import { ReviewDetailModal } from "@/components/reviews/review-detail-modal";

const LIMIT = 20;

const RATING_OPTIONS = [1, 2, 3, 4, 5];

export function ReviewsManager() {
  const [items, setItems] = useState<AdminReview[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [artistFilter, setArtistFilter] = useState<AdminUser | null>(null);
  const [reviewerFilter, setReviewerFilter] = useState<AdminUser | null>(null);
  const [tattooFilter, setTattooFilter] = useState<AdminTattoo | null>(null);
  const [ratingFilter, setRatingFilter] = useState("");

  const [busyId, setBusyId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<AdminReview | null>(null);
  const [viewing, setViewing] = useState<AdminReview | null>(null);
  const [deepLinkError, setDeepLinkError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const deepLinkReviewId = searchParams.get("reviewId");

  const { toasts, notify, dismiss } = useToasts();

  function closeViewing() {
    setViewing(null);
    if (deepLinkReviewId) router.replace("/reviews");
  }

  // The list endpoint doesn't embed the reviewer/artist/tattoo relations, so
  // each page's rows are enriched with individual lookups, cached by id since
  // the same artist/tattoo commonly repeats across rows. The ref is bookkeeping
  // only (read inside the async fetch, never during render); the state map is
  // what components actually render from.
  const userCacheRef = useRef<Map<number, AdminUser>>(new Map());
  const tattooCacheRef = useRef<Map<number, AdminTattooDetail>>(new Map());
  const [userCache, setUserCache] = useState<Map<number, AdminUser>>(new Map());
  const [tattooCache, setTattooCache] = useState<Map<number, AdminTattooDetail>>(new Map());
  // Ids currently being looked up — rows for these show a skeleton instead of a "User #<id>" fallback.
  const [pendingUserIds, setPendingUserIds] = useState<Set<number>>(new Set());
  const [pendingTattooIds, setPendingTattooIds] = useState<Set<number>>(new Set());

  const enrichRows = useCallback(async (rows: AdminReview[]) => {
    const missingUserIds = new Set<number>();
    const missingTattooIds = new Set<number>();
    for (const r of rows) {
      if (!userCacheRef.current.has(r.userId)) missingUserIds.add(r.userId);
      if (r.artistId != null && !userCacheRef.current.has(r.artistId)) missingUserIds.add(r.artistId);
      if (r.tattooId != null && !tattooCacheRef.current.has(r.tattooId)) missingTattooIds.add(r.tattooId);
    }
    if (missingUserIds.size === 0 && missingTattooIds.size === 0) return;

    setPendingUserIds((prev) => new Set([...prev, ...missingUserIds]));
    setPendingTattooIds((prev) => new Set([...prev, ...missingTattooIds]));

    const [userResults, tattooResults] = await Promise.all([
      Promise.allSettled([...missingUserIds].map((id) => usersApi.get(id).then((u) => [id, u] as const))),
      Promise.allSettled([...missingTattooIds].map((id) => tattoosApi.get(id).then((t) => [id, t] as const))),
    ]);
    for (const res of userResults) {
      if (res.status === "fulfilled") userCacheRef.current.set(res.value[0], res.value[1]);
    }
    for (const res of tattooResults) {
      if (res.status === "fulfilled") tattooCacheRef.current.set(res.value[0], res.value[1]);
    }
    setUserCache(new Map(userCacheRef.current));
    setTattooCache(new Map(tattooCacheRef.current));
    setPendingUserIds((prev) => {
      const next = new Set(prev);
      missingUserIds.forEach((id) => next.delete(id));
      return next;
    });
    setPendingTattooIds((prev) => {
      const next = new Set(prev);
      missingTattooIds.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  useEffect(() => {
    if (!deepLinkReviewId) return;
    const id = Number(deepLinkReviewId);
    if (!Number.isFinite(id)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeepLinkError(null);
    reviewsApi
      .get(id)
      .then((r) => {
        setViewing(r);
        void enrichRows([r]);
      })
      .catch(() => setDeepLinkError("That review couldn't be found."));
  }, [deepLinkReviewId, enrichRows]);

  function setArtistFilterAndReset(user: AdminUser | null) {
    setArtistFilter(user);
    setPage(1);
  }

  function setReviewerFilterAndReset(user: AdminUser | null) {
    setReviewerFilter(user);
    setPage(1);
  }

  function setTattooFilterAndReset(tattoo: AdminTattoo | null) {
    setTattooFilter(tattoo);
    setPage(1);
  }

  const filters = useMemo(
    () => ({
      page,
      limit: LIMIT,
      artistId: artistFilter?.id,
      userId: reviewerFilter?.id,
      tattooId: tattooFilter?.id,
      rating: ratingFilter ? Number(ratingFilter) : undefined,
    }),
    [page, artistFilter, reviewerFilter, tattooFilter, ratingFilter],
  );

  const load = useCallback(async () => {
    try {
      const res = await reviewsApi.list(filters);
      setItems(res.data);
      setPagination(res.pagination ?? null);
      setLoadError(null);
      void enrichRows(res.data);
    } catch (err) {
      setItems([]);
      setLoadError(err instanceof ApiError ? err.message : "Failed to load reviews.");
    }
  }, [filters, enrichRows]);

  useEffect(() => {
    // setState runs only after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  function setRatingAndReset(next: string) {
    setRatingFilter(next);
    setPage(1);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusyId(deleting.id);
    try {
      const res = await reviewsApi.remove(deleting.id);
      setItems((prev) => (prev ? prev.filter((r) => r.id !== deleting.id) : prev));
      setPagination((prev) => (prev ? { ...prev, total: Math.max(0, prev.total - 1) } : prev));
      setViewing((v) => (v && v.id === deleting.id ? null : v));
      notify(res.message ?? "Review deleted.", "success");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to delete review.", "danger");
    } finally {
      setBusyId(null);
      setDeleting(null);
    }
  }

  const loading = items === null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Reviews"
        subtitle={
          loading
            ? "Loading…"
            : pagination
              ? `${pagination.total} ${pagination.total === 1 ? "review" : "reviews"}`
              : undefined
        }
      />

      <Card className="grid grid-cols-2 gap-3 p-3 sm:flex sm:flex-wrap sm:items-end sm:gap-3 sm:p-4">
        <PersonSearchInput label="Artist" role="ARTIST" value={artistFilter} onChange={setArtistFilterAndReset} />
        <PersonSearchInput label="Reviewer" value={reviewerFilter} onChange={setReviewerFilterAndReset} />
        <TattooSearchInput value={tattooFilter} onChange={setTattooFilterAndReset} />
        <label className="flex flex-col gap-1 text-xs font-medium text-(--text-muted)">
          Rating
          <select
            value={ratingFilter}
            onChange={(e) => setRatingAndReset(e.target.value)}
            className="h-9 w-full rounded-md border border-(--border) bg-(--surface) px-2 text-sm text-(--text) outline-none transition-colors focus:border-(--accent) sm:w-28"
          >
            <option value="">Any</option>
            {RATING_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r} star{r > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </label>
      </Card>

      {loadError && (
        <div className="flex items-center justify-between rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)">
          <span>{loadError}</span>
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      )}

      {deepLinkError && (
        <p role="alert" className="rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-2 text-sm text-(--danger)">
          {deepLinkError}
        </p>
      )}

      <Card>
        {!loading && items && items.length === 0 ? (
          <EmptyState icon={StarIcon} title="No reviews found" description="Try a different filter." />
        ) : (
          <Table>
            <THead>
              <TH>Reviewer</TH>
              <TH>Target</TH>
              <TH>Rating</TH>
              <TH className="hidden sm:table-cell">Review</TH>
              <TH className="hidden lg:table-cell">Artist reply</TH>
              <TH className="hidden lg:table-cell">Created</TH>
            </THead>
            <TBody>
              {loading
                ? Array.from({ length: 6 }, (_, i) => <SkeletonRow key={i} />)
                : (items ?? []).map((r) => (
                    <TR key={r.id} onClick={() => setViewing(r)}>
                      <TD className="max-w-48">
                        <MiniPerson
                          user={userCache.get(r.userId) ?? null}
                          fallbackId={r.userId}
                          loading={pendingUserIds.has(r.userId)}
                        />
                      </TD>
                      <TD className="max-w-56">
                        <TargetCell
                          review={r}
                          artist={r.artistId != null ? (userCache.get(r.artistId) ?? null) : null}
                          tattoo={r.tattooId != null ? (tattooCache.get(r.tattooId) ?? null) : null}
                          loading={
                            r.artistId != null ? pendingUserIds.has(r.artistId) : pendingTattooIds.has(r.tattooId ?? -1)
                          }
                        />
                      </TD>
                      <TD>
                        <Stars rating={r.rating} />
                        <span className="sr-only">{r.rating} out of 5</span>
                      </TD>
                      <TD className="hidden max-w-xs sm:table-cell text-(--text-secondary)">
                        {r.review ? <span className="block truncate">{r.review}</span> : <span className="text-(--text-subtle)">—</span>}
                      </TD>
                      <TD className="hidden max-w-xs lg:table-cell text-(--text-muted)">
                        {r.artistReply ? <span className="line-clamp-2">{r.artistReply}</span> : <span className="text-(--text-subtle)">—</span>}
                      </TD>
                      <TD className="hidden lg:table-cell text-(--text-muted) tabular-nums whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </TD>
                    </TR>
                  ))}
            </TBody>
          </Table>
        )}
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-(--text-muted)">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={pagination.page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete review?">
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-(--text-secondary)">
              Delete the review by <span className="font-medium text-(--text)">{reviewerName(deleting)}</span> on{" "}
              <span className="font-medium text-(--text)">{reviewTargetLabel(deleting)}</span>? This is permanent — there is no undo.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" disabled={busyId === deleting.id} onClick={() => void confirmDelete()}>
                {busyId === deleting.id ? "…" : "Delete"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ReviewDetailModal review={viewing} onClose={closeViewing} onDelete={(r) => setDeleting(r)} />

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function SkeletonRow() {
  return (
    <TR>
      <TD><Skeleton className="h-4 w-full max-w-24 rounded" /></TD>
      <TD><Skeleton className="h-4 w-full max-w-24 rounded" /></TD>
      <TD><Skeleton className="h-4 w-full max-w-24 rounded" /></TD>
      <TD className="hidden sm:table-cell"><Skeleton className="h-4 w-full max-w-24 rounded" /></TD>
      <TD className="hidden lg:table-cell"><Skeleton className="h-4 w-full max-w-24 rounded" /></TD>
      <TD className="hidden lg:table-cell"><Skeleton className="h-4 w-full max-w-24 rounded" /></TD>
    </TR>
  );
}
