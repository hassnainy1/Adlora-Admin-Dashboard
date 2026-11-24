"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Toggle } from "@/components/ui/toggle";
import { ArrowLeftIcon, ArtistsIcon } from "@/components/icons";
import { ApiError, mediaUrl } from "@/lib/api";
import {
  usersApi,
  portfoliosApi,
  fullName,
  type AdminUser,
  type UserStatus,
  type UserAction,
  type Portfolio,
  type PortfolioReviewStatus,
} from "@/lib/users";

const statusTone: Record<UserStatus, BadgeTone> = {
  active: "success",
  pending: "warning",
  suspended: "danger",
  deleted: "neutral",
};

const reviewTone: Record<PortfolioReviewStatus, BadgeTone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

function initials(u: AdminUser) {
  return `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

export function ArtistDetail({ id }: { id: string }) {
  const [artist, setArtist] = useState<AdminUser | null>(null);
  const [state, setState] = useState<"loading" | "loaded" | "notfound" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<{ action: UserAction; label: string } | null>(null);
  const [reason, setReason] = useState("");
  const [portfolioBusyId, setPortfolioBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const data = await usersApi.get(id);
      setArtist(data);
      setState("loaded");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setState("notfound");
      } else {
        setErrorMsg(err instanceof ApiError ? err.message : "Failed to load artist.");
        setState("error");
      }
    }
  }, [id]);

  useEffect(() => {
    // setState runs only after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const REASON_REQUIRED: UserAction[] = ["suspend", "reject"];

  function requestAction(action: UserAction, label: string) {
    if (REASON_REQUIRED.includes(action)) {
      setReason("");
      setConfirming({ action, label });
    } else {
      void runAction(action);
    }
  }

  async function runAction(action: UserAction, actionReason?: string) {
    if (!artist) return;
    setBusy(true);
    setActionError(null);
    try {
      const updated = await usersApi.action(artist.id, action, actionReason || undefined);
      setArtist(updated);
      setConfirming(null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to update artist.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleVerified() {
    if (!artist) return;
    await runAction(artist.isVerified ? "unverify" : "verify");
  }

  async function reviewPortfolio(portfolio: Portfolio, decision: "approve" | "reject") {
    setPortfolioBusyId(portfolio.id);
    setActionError(null);
    try {
      if (decision === "approve") await portfoliosApi.approve(portfolio.id);
      else await portfoliosApi.reject(portfolio.id);
      // The action endpoint doesn't reliably return the full updated portfolio,
      // so apply the known-good status locally instead of trusting its response shape.
      const nextStatus: PortfolioReviewStatus = decision === "approve" ? "APPROVED" : "REJECTED";
      setArtist((prev) =>
        prev
          ? {
              ...prev,
              portfolios: (prev.portfolios ?? []).map((p) =>
                p.id === portfolio.id ? { ...p, portfolioReviewStatus: nextStatus } : p,
              ),
            }
          : prev,
      );
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to update portfolio item.");
    } finally {
      setPortfolioBusyId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <Link
        href="/artists"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-(--text-muted) transition-colors hover:text-(--text)"
      >
        <ArrowLeftIcon width={16} height={16} /> Back to artists
      </Link>

      {state === "loading" && <DetailSkeleton />}

      {state === "notfound" && (
        <Card>
          <EmptyState icon={ArtistsIcon} title="Artist not found" description={`No artist with id ${id}.`} />
        </Card>
      )}

      {state === "error" && (
        <div className="flex items-center justify-between rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)">
          <span>{errorMsg}</span>
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      )}

      {state === "loaded" && artist && (
        <>
          <Card glass className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                {artist.profileImageUrl ? (
                  <img
                    src={mediaUrl(artist.profileImageUrl) ?? undefined}
                    alt={fullName(artist)}
                    className="h-16 w-16 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-(--c-violet-soft) text-xl font-semibold text-(--c-violet)">
                    {initials(artist)}
                  </span>
                )}
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-semibold tracking-tight text-(--text)">{fullName(artist)}</h1>
                  <p className="truncate text-sm text-(--text-muted)">
                    {[artist.studioName, [artist.city, artist.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ") || artist.email}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge tone={statusTone[artist.status] ?? "neutral"}>{artist.status}</Badge>
                    <Badge tone={artist.isVerified ? "success" : "neutral"}>{artist.isVerified ? "Verified" : "Unverified"}</Badge>
                    {artist.portfolioReviewStatus && (
                      <Badge tone={reviewTone[artist.portfolioReviewStatus]}>portfolio: {artist.portfolioReviewStatus.toLowerCase()}</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                <div className="flex flex-wrap gap-2">
                  {artist.status === "active" ? (
                    <Button variant="danger" size="sm" disabled={busy} onClick={() => requestAction("suspend", "Suspend account")}>
                      Suspend
                    </Button>
                  ) : (
                    <Button variant="secondary" size="sm" disabled={busy} onClick={() => requestAction("activate", "Activate account")}>
                      Activate
                    </Button>
                  )}
                </div>
                <label className="flex items-center gap-2 text-xs text-(--text-muted)">
                  Identity verified
                  <Toggle checked={artist.isVerified} onChange={() => void toggleVerified()} label="Identity verified" />
                </label>
              </div>
            </div>

            {actionError && (
              <p role="alert" className="mt-4 rounded-md border border-(--danger) bg-(--danger-soft) px-3 py-2 text-sm text-(--danger)">
                {actionError}
              </p>
            )}
            {artist.portfolioReviewStatus === "REJECTED" && (
              <p className="mt-4 text-sm text-(--text-muted)">This application was rejected. Approving will reopen it.</p>
            )}
          </Card>

          <Card className="p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-(--text)">Account details</h2>
            <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              {(
                [
                  ["Email", artist.email],
                  ["Mobile", artist.mobile || "—"],
                  ["Gender", artist.gender || "—"],
                  ["Date of birth", artist.dateOfBirth ? new Date(artist.dateOfBirth).toLocaleDateString() : "—"],
                  ["Studio", artist.studioName || "—"],
                  ["Experience", artist.experience || "—"],
                  ["Location", [artist.address, artist.city, artist.state, artist.country, artist.postalCode].filter(Boolean).join(", ") || "—"],
                  ["Website", artist.website || "—"],
                  ["Instagram", artist.instagram || "—"],
                  ["Facebook", artist.facebook || "—"],
                  ["Joined", new Date(artist.createdAt).toLocaleString()],
                  ["Updated", new Date(artist.updatedAt).toLocaleString()],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-(--border-subtle) py-2 last:border-0">
                  <dt className="text-sm text-(--text-muted)">{k}</dt>
                  <dd className="truncate text-right text-sm font-medium text-(--text)">{v}</dd>
                </div>
              ))}
            </dl>
            {artist.bio && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold tracking-wide text-(--text-muted) uppercase">Bio</h3>
                <p className="mt-1 text-sm text-(--text-secondary)">{artist.bio}</p>
              </div>
            )}
            {(artist.specialities ?? []).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {(artist.specialities ?? []).map((s) => (
                  <Badge key={s.id} tone="accent">
                    {s.name}
                  </Badge>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-(--text)">Portfolio</h2>
            {(artist.portfolios ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-(--text-muted)">No portfolio submitted yet.</p>
            ) : (
              <div className="mt-4 space-y-6">
                {(artist.portfolios ?? []).map((p) => (
                  <PortfolioItem
                    key={p.id}
                    portfolio={p}
                    busy={portfolioBusyId === p.id}
                    onDecide={(decision) => void reviewPortfolio(p, decision)}
                  />
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      <Modal open={confirming !== null} onClose={() => setConfirming(null)} title={confirming ? `${confirming.label}?` : ""}>
        {confirming && artist && (
          <div className="space-y-4">
            <p className="text-sm text-(--text-secondary)">
              {confirming.label} for {fullName(artist)} ({artist.email})?
            </p>
            <label className="block text-sm font-medium text-(--text-secondary)">
              Reason <span className="font-normal text-(--text-subtle)">(recorded for the audit trail)</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Why is this action being taken?"
                className="mt-1.5 w-full rounded-md border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text) placeholder:text-(--text-subtle) outline-none transition-colors focus:border-(--accent)"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setConfirming(null)}>
                Cancel
              </Button>
              <Button
                variant={confirming.action === "suspend" || confirming.action === "reject" ? "danger" : "primary"}
                size="sm"
                disabled={busy}
                onClick={() => void runAction(confirming.action, reason.trim())}
              >
                {busy ? "…" : confirming.label}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function PortfolioItem({
  portfolio,
  busy,
  onDecide,
}: {
  portfolio: Portfolio;
  busy: boolean;
  onDecide: (decision: "approve" | "reject") => void;
}) {
  return (
    <div className="space-y-3 border-t border-(--border-subtle) pt-4 first:border-0 first:pt-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-(--text)">{portfolio.title}</p>
          {portfolio.description && <p className="text-sm text-(--text-muted)">{portfolio.description}</p>}
        </div>
        <Badge tone={reviewTone[portfolio.portfolioReviewStatus]}>{portfolio.portfolioReviewStatus.toLowerCase()}</Badge>
      </div>

      {portfolio.portfolioReviewStatus === "REJECTED" && portfolio.rejectionReason && (
        <p className="rounded-md border border-(--danger) bg-(--danger-soft) px-3 py-2 text-sm text-(--danger)">
          Rejection reason: {portfolio.rejectionReason}
        </p>
      )}

      {(portfolio.styles ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(portfolio.styles ?? []).map((s) => (
            <Badge key={s.id} tone="accent">
              {s.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {(portfolio.media ?? []).map((m) => (
          <img
            key={m.id}
            src={mediaUrl(m.thumbnailUrl ?? m.fileUrl) ?? undefined}
            alt={portfolio.title}
            className="aspect-square w-full rounded-md border border-(--border) object-cover"
          />
        ))}
      </div>

      <div className="flex justify-end gap-2">
        {portfolio.portfolioReviewStatus !== "REJECTED" && (
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => onDecide("reject")}>
            {busy ? "…" : "Reject item"}
          </Button>
        )}
        {portfolio.portfolioReviewStatus !== "APPROVED" && (
          <Button size="sm" disabled={busy} onClick={() => onDecide("approve")}>
            {busy ? "…" : "Approve item"}
          </Button>
        )}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-32 rounded-(--radius) bg-(--surface-2)" />
      <div className="h-64 rounded-(--radius) bg-(--surface-2)" />
    </div>
  );
}
