"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/cn";

const tabs = ["General", "Security", "Notifications"] as const;
type Tab = (typeof tabs)[number];

/**
 * There is no settings API yet, so this page lists what will be configurable
 * without showing values or controls: an editable "Require MFA: on" would claim
 * a protection that nothing enforces.
 */
const plannedSettings: Record<Tab, { label: string; hint: string }[]> = {
  General: [
    { label: "Platform name", hint: "Name shown across the platform" },
    { label: "Feed limit", hint: "Max posts shown in the discovery feed" },
    { label: "Default privacy", hint: "Applied to new tattoos" },
  ],
  Security: [
    { label: "Require MFA", hint: "Force multi-factor auth for admins" },
    { label: "Strong password policy", hint: "Password length and complexity rules" },
    { label: "Rate limiting", hint: "Throttle abusive API clients" },
  ],
  Notifications: [
    { label: "Push notifications", hint: "Push-first delivery to mobile apps" },
    { label: "Email notifications", hint: "Send admin digests by email" },
  ],
};

export function SettingsPanel() {
  const [tab, setTab] = useState<Tab>("General");

  return (
    <div className="space-y-4">
      <p className="rounded-md border border-(--warning) bg-(--warning-soft) px-4 py-3 text-sm text-(--warning)">
        These settings aren&apos;t connected yet. Nothing here is active or can be changed from this page.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-(--border)">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors",
              t === tab ? "text-(--accent)" : "text-(--text-muted) hover:text-(--text)",
            )}
          >
            {t}
            {t === tab && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-(--accent)" />
            )}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader title={tab} />
        <ul className="px-5 py-2">
          {plannedSettings[tab].map(({ label, hint }) => (
            <li
              key={label}
              className="flex flex-col gap-2 border-b border-(--border-subtle) py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-(--text)">{label}</p>
                <p className="text-xs text-(--text-muted)">{hint}</p>
              </div>
              <Badge className="shrink-0 self-start sm:self-auto">Not available yet</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
