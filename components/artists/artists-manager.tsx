"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Table, THead, TH, TBody, TR, TD } from "@/components/ui/table";
import { Toggle } from "@/components/ui/toggle";
import { ArtistsIcon, SearchIcon, CheckIcon, ShieldIcon, FlagIcon, type Icon } from "@/components/icons";
import { ApiError, mediaUrl } from "@/lib/api";
import type { Pagination } from "@/lib/api";
import { catalogApi, type CatalogItem } from "@/lib/catalog";
import {
  usersApi,
  fullName,
  type AdminUser,
  type UserStatus,
  type PortfolioReviewStatus,
  type UserAction,
} from "@/lib/users";
import { useRefreshOn } from "@/lib/data-refresh";
import { cn } from "@/lib/cn";

const LIMIT = 20;

const statusTone: Record<UserStatus, BadgeTone> = {
  active: "success",
  pending: "warning",
  suspended: "danger",
  deleted: "neutral",
};

/** A dedicated "Deleted" tab so deleted artists don't clutter the default view mixed in with active ones. */
const STATUS_TABS: { value: UserStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "pending", label: "Pending" },
  { value: "deleted", label: "Deleted" },
];

const REVIEW_OPTIONS: { value: PortfolioReviewStatus | ""; label: string }[] = [
  { value: "", label: "All review statuses" },
  { value: "PENDING", label: "Pending review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function initials(u: AdminUser) {
  return `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

type MenuAction = { action: UserAction; label: string; icon: Icon; tone?: "danger"; divideAfter?: boolean };

function menuActionsFor(u: AdminUser): MenuAction[] {
  const actions: MenuAction[] = [];
  if (u.portfolioReviewStatus !== "APPROVED") {
    actions.push({ action: "approve", label: "Approve application", icon: CheckIcon });
  }
  if (u.portfolioReviewStatus !== "REJECTED") {
    actions.push({ action: "reject", label: "Reject application", icon: FlagIcon, tone: "danger" });
  }
  if (actions.length > 0) actions[actions.length - 1].divideAfter = true;
  actions.push(
    u.status === "active"
      ? { action: "suspend", label: "Suspend", icon: ShieldIcon, tone: "danger" }
      : { action: "activate", label: "Activate", icon: CheckIcon },
  );
  return actions;
}

/** suspend/reject are punitive — always ask for a reason before firing, for the audit trail. */
const REASON_REQUIRED: UserAction[] = ["suspend", "reject"];

export function ArtistsManager() {
  const [items, setItems] = useState<AdminUser[] | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [specialityFilter, setSpecialityFilter] = useState<string>("");
  const [reviewFilter, setReviewFilter] = useState<PortfolioReviewStatus | "">("");
  const [specialities, setSpecialities] = useState<CatalogItem[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<{ user: AdminUser; action: UserAction; label: string } | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    catalogApi("specialities")
      .list()
      .then(setSpecialities)
      .catch(() => setSpecialities([]));
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  const filters = useMemo(
    () => ({
      page,
      limit: LIMIT,
      role: "ARTIST" as const,
      search: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      specialityId: specialityFilter ? Number(specialityFilter) : undefined,
      portfolioReviewStatus: reviewFilter || undefined,
    }),
    [page, search, statusFilter, specialityFilter, reviewFilter],
  );

  const load = useCallback(async () => {
    try {
      const res = await usersApi.listPaged(filters);
      // The API has no "exclude deleted" filter, so an unfiltered "All" request
      // still returns deleted artists — they belong only under the Deleted tab.
      setItems(statusFilter === "all" ? res.data.filter((u) => u.status !== "deleted") : res.data);
      setPagination(res.pagination ?? null);
      setLoadError(null);
    } catch (err) {
      setItems([]);
      setLoadError(err instanceof ApiError ? err.message : "Failed to load artists.");
    }
  }, [filters, statusFilter]);

  useEffect(() => {
    // setState runs only after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useRefreshOn("artists", load);

  function updateResult(updated: AdminUser) {
    setItems((prev) => (prev ?? []).map((u) => (u.id === updated.id ? updated : u)));
  }

  async function runAction(user: AdminUser, action: UserAction, actionReason?: string) {
    setBusyId(user.id);
    setRowError(null);
    try {
      const updated = await usersApi.action(user.id, action, actionReason || undefined);
      updateResult(updated);
    } catch (err) {
      setRowError(err instanceof ApiError ? err.message : "Failed to update artist.");
    } finally {
      setBusyId(null);
    }
  }

  function requestAction(user: AdminUser, action: UserAction, label: string) {
    setOpenMenuId(null);
    if (REASON_REQUIRED.includes(action)) {
      setReason("");
      setConfirming({ user, action, label });
    } else {
      void runAction(user, action);
    }
  }

  async function confirmAction() {
    if (!confirming) return;
    await runAction(confirming.user, confirming.action, reason.trim());
    setConfirming(null);
  }

  async function toggleVerified(user: AdminUser) {
    await runAction(user, user.isVerified ? "unverify" : "verify");
  }

  const loading = items === null;
  const hasFilters = Boolean(statusFilter !== "all" || specialityFilter || reviewFilter);

  function clearFilters() {
    setStatusFilter("all");
    setSpecialityFilter("");
    setReviewFilter("");
    setPage(1);
  }

  function setStatusFilterAndReset(next: UserStatus | "all") {
    setStatusFilter(next);
    setPage(1);
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Artists"
        subtitle={
          loading
            ? "Loading…"
            : pagination
              ? `${pagination.total} ${pagination.total === 1 ? "artist" : "artists"}`
              : undefined
        }
      />

      <div className="flex items-center gap-1 overflow-x-auto rounded-md border border-(--border) bg-(--surface) p-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setStatusFilterAndReset(t.value)}
            className={cn(
              "shrink-0 rounded px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === t.value
                ? "bg-(--accent) text-(--accent-foreground)"
                : "text-(--text-muted) hover:bg-(--surface-2) hover:text-(--text)",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="flex flex-wrap items-end gap-1.5 p-3 sm:gap-3 sm:p-4">
        <label className="flex min-w-0 flex-1 basis-full flex-col gap-1 text-xs font-medium text-(--text-muted) sm:basis-56">
          Search
          <span className="relative">
            <SearchIcon
              width={16}
              height={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-(--text-subtle)"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or email…"
              className="h-9 w-full rounded-md border border-(--border) bg-(--surface) pl-9 pr-3 text-sm text-(--text) placeholder:text-(--text-subtle) outline-none transition-colors focus:border-(--accent)"
            />
          </span>
        </label>

        <FilterSelect
          label="Portfolio review"
          value={reviewFilter}
          onChange={(v) => { setReviewFilter(v as PortfolioReviewStatus | ""); setPage(1); }}
          options={REVIEW_OPTIONS}
        />
        <FilterSelect
          label="Speciality"
          value={specialityFilter}
          onChange={(v) => { setSpecialityFilter(v); setPage(1); }}
          options={[{ value: "", label: "All specialities" }, ...specialities.map((s) => ({ value: String(s.id), label: s.name }))]}
        />

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </Card>

      {loadError && (
        <div className="flex items-center justify-between rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)">
          <span>{loadError}</span>
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      )}

      {rowError && (
        <p role="alert" className="rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-2 text-sm text-(--danger)">
          {rowError}
        </p>
      )}

      <Card className="overflow-visible">
        {!loading && items && items.length === 0 ? (
          <EmptyState
            icon={ArtistsIcon}
            title="No artists found"
            description={search || hasFilters ? "Try a different search or filter." : "No artist applications yet."}
          />
        ) : (
          <Table>
            <THead>
              <TH>Artist</TH>
              <TH className="hidden md:table-cell">Speciality</TH>
              <TH className="hidden sm:table-cell">Status</TH>
              <TH className="hidden sm:table-cell">Verified</TH>
              <TH className="hidden lg:table-cell">Submitted</TH>
              <TH className="text-right">Actions</TH>
            </THead>
            <TBody>
              {loading ? (
                <SkeletonRows />
              ) : (
                (items ?? []).map((u) => (
                  <ArtistRow
                    key={u.id}
                    user={u}
                    busy={busyId === u.id}
                    menuOpen={openMenuId === u.id}
                    onOpenMenu={() => setOpenMenuId(openMenuId === u.id ? null : u.id)}
                    onCloseMenu={() => setOpenMenuId(null)}
                    onAction={(action, label) => requestAction(u, action, label)}
                    onToggleVerified={() => void toggleVerified(u)}
                  />
                ))
              )}
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

      <Modal open={confirming !== null} onClose={() => setConfirming(null)} title={confirming ? `${confirming.label}?` : ""}>
        {confirming && (
          <div className="space-y-4">
            <p className="text-sm text-(--text-secondary)">
              {confirming.label} {fullName(confirming.user)}
              {confirming.user.email ? ` (${confirming.user.email})` : ""}?
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
                disabled={busyId === confirming.user.id}
                onClick={() => void confirmAction()}
              >
                {busyId === confirming.user.id ? "…" : confirming.label}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ArtistRow({
  user,
  busy,
  menuOpen,
  onOpenMenu,
  onCloseMenu,
  onAction,
  onToggleVerified,
}: {
  user: AdminUser;
  busy: boolean;
  menuOpen: boolean;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  onAction: (action: UserAction, label: string) => void;
  onToggleVerified: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const actions = menuActionsFor(user);
  const location = [user.city, user.state].filter(Boolean).join(", ");

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onCloseMenu();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen, onCloseMenu]);

  return (
    <TR>
      <TD>
        <Link href={`/artists/${user.id}`} className="group/row flex items-center gap-2 sm:gap-3">
          {user.profileImageUrl ? (
            <img
              src={mediaUrl(user.profileImageUrl) ?? undefined}
              alt={fullName(user)}
              className="h-7 w-7 shrink-0 rounded-full object-cover sm:h-9 sm:w-9"
            />
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--c-violet-soft) text-xs font-semibold text-(--c-violet) sm:h-9 sm:w-9">
              {initials(user)}
            </span>
          )}
          <div className="min-w-0 max-w-[9rem] sm:max-w-none">
            <div className="truncate font-medium text-(--text) group-hover/row:text-(--accent)">{fullName(user)}</div>
            <div className="truncate text-xs text-(--text-subtle)">{user.email}</div>
          </div>
        </Link>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:hidden">
          <Badge tone={statusTone[user.status] ?? "neutral"}>{user.status}</Badge>
          <Toggle size="sm" checked={user.isVerified} onChange={onToggleVerified} label="Identity verified" />
          <span className="text-[11px] text-(--text-subtle)">Verified</span>
        </div>
      </TD>
      <TD className="hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {(user.specialities ?? []).length > 0 ? (
            (user.specialities ?? []).slice(0, 2).map((s) => (
              <Badge key={s.id} tone="accent">
                {s.name}
              </Badge>
            ))
          ) : (
            <span className="text-(--text-subtle)">{user.studioName ?? location ?? "—"}</span>
          )}
        </div>
      </TD>
      <TD className="hidden sm:table-cell">
        <Badge tone={statusTone[user.status] ?? "neutral"}>{user.status}</Badge>
      </TD>
 
      <TD className="hidden sm:table-cell">
        <Toggle checked={user.isVerified} onChange={onToggleVerified} label="Identity verified" />
      </TD>
      <TD className="hidden lg:table-cell whitespace-nowrap text-(--text-muted)">
        {new Date(user.createdAt).toLocaleDateString()}
      </TD>
      <TD className="text-right">
        <div ref={menuRef} className="relative inline-block text-left">
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={onOpenMenu}
            className="h-7 gap-1 px-2 text-[11px] sm:h-8 sm:gap-1.5 sm:px-3 sm:text-xs"
          >
            {busy ? "…" : "Actions"}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform duration-150", menuOpen && "rotate-180")}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </Button>
          {menuOpen && (
            <div className="animate-in fade-in slide-in-from-top-1 absolute right-0 z-20 mt-1.5 w-44 max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-(--border) bg-(--surface) py-1 shadow-lg duration-100 sm:w-52">
              {actions.map((a, i) => (
                <div key={a.action}>
                  <button
                    type="button"
                    onClick={() => onAction(a.action, a.label)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-(--surface-2)",
                      a.tone === "danger" ? "text-(--danger)" : "text-(--text-secondary)",
                    )}
                  >
                    <a.icon width={14} height={14} />
                    {a.label}
                  </button>
                  {a.divideAfter && i < actions.length - 1 && <div className="my-1 h-px bg-(--border-subtle)" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </TD>
    </TR>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-(--text-muted)">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 min-w-36 rounded-md border border-(--border) bg-(--surface) px-2 text-sm text-(--text)"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <TR key={i}>
          <TD>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-(--surface-2)" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-32 animate-pulse rounded bg-(--surface-2)" />
                <div className="h-3 w-40 animate-pulse rounded bg-(--surface-2)" />
              </div>
            </div>
          </TD>
          <TD className="hidden md:table-cell"><div className="h-4 w-20 animate-pulse rounded bg-(--surface-2)" /></TD>
          <TD className="hidden sm:table-cell"><div className="h-4 w-16 animate-pulse rounded bg-(--surface-2)" /></TD>
          <TD className="hidden sm:table-cell"><div className="h-4 w-16 animate-pulse rounded bg-(--surface-2)" /></TD>
          <TD className="hidden sm:table-cell"><div className="h-6 w-11 animate-pulse rounded-full bg-(--surface-2)" /></TD>
          <TD className="hidden lg:table-cell"><div className="h-4 w-20 animate-pulse rounded bg-(--surface-2)" /></TD>
          <TD className="text-right"><div className="ml-auto h-8 w-20 animate-pulse rounded-md bg-(--surface-2)" /></TD>
        </TR>
      ))}
    </>
  );
}
