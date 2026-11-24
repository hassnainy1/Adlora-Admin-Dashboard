"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowLeftIcon, UsersIcon } from "@/components/icons";
import { ApiError } from "@/lib/api";
import { usersApi, fullName, type AdminUser, type UserStatus } from "@/lib/users";

const statusTone: Record<UserStatus, BadgeTone> = {
  active: "success",
  pending: "warning",
  suspended: "danger",
  deleted: "neutral",
};

function initials(u: AdminUser) {
  return `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

export function UserDetail({ id }: { id: string }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [state, setState] = useState<"loading" | "loaded" | "notfound" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const data = await usersApi.get(id);
      setUser(data);
      setState("loaded");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setState("notfound");
      } else {
        setErrorMsg(err instanceof ApiError ? err.message : "Failed to load user.");
        setState("error");
      }
    }
  }, [id]);

  useEffect(() => {
    // setState runs only after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function toggleStatus() {
    if (!user) return;
    const activate = user.status !== "active";
    setBusy(true);
    setActionError(null);
    try {
      const updated = activate
        ? await usersApi.activate(user.id)
        : await usersApi.suspend(user.id);
      setUser(updated);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to update user.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <Link
        href="/users"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-(--text-muted) transition-colors hover:text-(--text)"
      >
        <ArrowLeftIcon width={16} height={16} /> Back to users
      </Link>

      {state === "loading" && <DetailSkeleton />}

      {state === "notfound" && (
        <Card>
          <EmptyState icon={UsersIcon} title="User not found" description={`No user with id ${id}.`} />
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

      {state === "loaded" && user && (
        <>
          <Card glass className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-(--accent) text-xl font-semibold text-(--accent-foreground)">
                  {initials(user)}
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-semibold tracking-tight text-(--text)">
                    {fullName(user)}
                  </h1>
                  <p className="truncate text-sm text-(--text-muted)">{user.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge tone={user.role === "ARTIST" ? "accent" : user.role === "ADMIN" ? "info" : "neutral"}>
                      {user.role}
                    </Badge>
                    <Badge tone={statusTone[user.status] ?? "neutral"}>{user.status}</Badge>
                    <Badge tone={user.isVerified ? "success" : "neutral"}>
                      {user.isVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                {user.status === "active" ? (
                  <Button variant="danger" size="sm" disabled={busy} onClick={() => void toggleStatus()}>
                    {busy ? "Suspending…" : "Suspend"}
                  </Button>
                ) : (
                  <Button size="sm" disabled={busy} onClick={() => void toggleStatus()}>
                    {busy ? "Activating…" : "Activate"}
                  </Button>
                )}
                {actionError && (
                  <span role="alert" className="text-xs text-(--danger)">
                    {actionError}
                  </span>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-(--text)">Account details</h2>
            <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              {(
                [
                  ["Email", user.email],
                  ["Role", user.role],
                  ["Status", user.status],
                  ["Verified", user.isVerified ? "Yes" : "No"],
                  ["Mobile", user.mobile || "—"],
                  ["Location", [user.city, user.state, user.country].filter(Boolean).join(", ") || "—"],
                  ["Joined", new Date(user.createdAt).toLocaleString()],
                  ["Updated", new Date(user.updatedAt).toLocaleString()],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-(--border-subtle) py-2 last:border-0">
                  <dt className="text-sm text-(--text-muted)">{k}</dt>
                  <dd className="truncate text-sm font-medium text-(--text)">{v}</dd>
                </div>
              ))}
            </dl>
            {user.bio && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">Bio</h3>
                <p className="mt-1 text-sm text-(--text-secondary)">{user.bio}</p>
              </div>
            )}
          </Card>
        </>
      )}
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
