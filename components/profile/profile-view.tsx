"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ApiError } from "@/lib/api";
import { profileApi, type Profile } from "@/lib/profile";

const statusTone: Record<string, BadgeTone> = {
  active: "success",
  suspended: "danger",
  pending: "warning",
};

function initials(p: Profile) {
  return `${p.firstName?.[0] ?? ""}${p.lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

export function ProfileView() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const data = await profileApi.get();
      setProfile(data);
      setState("loaded");
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Failed to load profile.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    // setState runs only after the fetch resolves — no render loop.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Profile" subtitle="Your admin account" />

      {state === "loading" && <ProfileSkeleton />}

      {state === "error" && (
        <div className="flex items-center justify-between rounded-md border border-(--danger) bg-(--danger-soft) px-4 py-3 text-sm text-(--danger)">
          <span>{errorMsg}</span>
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      )}

      {state === "loaded" && profile && (
        <>
          <Card glass className="p-6">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-(--accent) text-2xl font-semibold text-(--accent-foreground)">
                {initials(profile)}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold tracking-tight text-(--text)">
                  {`${profile.firstName} ${profile.lastName}`.trim() || "Unnamed"}
                </h2>
                <p className="truncate text-sm text-(--text-muted)">{profile.email}</p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <Badge tone="info">{profile.role}</Badge>
                  <Badge tone={statusTone[profile.status] ?? "neutral"}>{profile.status}</Badge>
                  <Badge tone={profile.isVerified ? "success" : "neutral"}>
                    {profile.isVerified ? "Verified" : "Unverified"}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-(--text)">Account details</h3>
            <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              {(
                [
                  ["User ID", String(profile.id)],
                  ["Email", profile.email],
                  ["Role", profile.role],
                  ["Status", profile.status],
                  // ["Verified", profile.isVerified ? "Yes" : "No"],
                  // ["Mobile", profile.mobile || "—"],
                  // ["Studio", profile.studioName || "—"],
                  // ["Experience", profile.experience || "—"],
                  // ["Website", profile.website || "—"],
                  // ["Instagram", profile.instagram || "—"],
                  // ["Facebook", profile.facebook || "—"],
                  // ["Address", profile.address || "—"],
                  // ["Location", [profile.city, profile.state, profile.country].filter(Boolean).join(", ") || "—"],
                  ["Joined", new Date(profile.createdAt).toLocaleString()],
                  ["Updated", new Date(profile.updatedAt).toLocaleString()],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-(--border-subtle) py-2 last:border-0">
                  <dt className="text-sm text-(--text-muted)">{k}</dt>
                  <dd className="truncate text-sm font-medium text-(--text)">{v}</dd>
                </div>
              ))}
            </dl>
            {profile.bio && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">Bio</h4>
                <p className="mt-1 text-sm text-(--text-secondary)">{profile.bio}</p>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-32 rounded-(--radius) bg-(--surface-2)" />
      <div className="h-72 rounded-(--radius) bg-(--surface-2)" />
    </div>
  );
}
