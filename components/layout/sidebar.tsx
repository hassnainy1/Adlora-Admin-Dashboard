"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { navSections } from "@/lib/nav";
import { logout, getCurrentUserRaw, type AuthUser } from "@/lib/auth";
import { useNavBadges } from "@/lib/use-nav-badges";
import { LogoutIcon } from "@/components/icons";
import Logo from "@/public/logo.png";
import { cn } from "@/lib/cn";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function useCurrentUser(): AuthUser | null {
  const raw = useSyncExternalStore(subscribe, getCurrentUserRaw, () => null);
  return useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }, [raw]);
}

export function Sidebar({
  onNavigate,
  collapsed = false,
  onToggleCollapsed,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();
  const badges = useNavBadges();

  const name = user ? `${user.firstName} ${user.lastName}` : "Admin User";
  const initials = user
    ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
    : "AD";

  function onSignOut() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="flex h-full flex-col bg-(--sidebar) text-(--sidebar-text)">
      {/* Brand (doubles as the collapse/expand toggle when onToggleCollapsed is provided) */}
      <button
        type="button"
        onClick={onToggleCollapsed}
        disabled={!onToggleCollapsed}
        aria-label={
          onToggleCollapsed
            ? collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
            : undefined
        }
        title={
          onToggleCollapsed
            ? collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
            : undefined
        }
        className={cn(
          "flex min-h-28 shrink-0 flex-col items-center justify-center border-b border-(--sidebar-border) py-5 text-center",
          collapsed ? "px-2" : "px-5",
          onToggleCollapsed && "transition-colors hover:bg-(--sidebar-elevated)",
        )}
      >
        <span
          className={cn(
            "flex items-center justify-center transition-all",
            collapsed ? "h-12 w-12" : "h-12 w-12",
          )}
        >
          <Image
            src={Logo}
            alt="Adlora logo"
            width={48}
            height={48}
            className="object-contain"
            priority
          />
        </span>
        {!collapsed && (
          <span className="mt-2 text-center leading-tight">
            <span className="block text-[15px] font-bold tracking-wider text-white uppercase">
              Adlora
            </span>
            <span className="block text-[10px] font-medium tracking-widest text-(--sidebar-accent) uppercase">
              Legal Services & Advocacy
            </span>
          </span>
        )}
      </button>

      {/* Navigation */}
      <nav className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-(--sidebar-text-muted) uppercase">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href);
                const IconCmp = item.icon;
                const badge = badges[item.href] ?? item.badge;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group relative flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                        collapsed && "justify-center px-0",
                        active
                          ? "bg-(--sidebar-active) font-medium text-white"
                          : "text-(--sidebar-text) hover:bg-(--sidebar-elevated) hover:text-white",
                      )}
                    >
                      <IconCmp
                        width={18}
                        height={18}
                        className={cn(
                          "shrink-0",
                          active
                            ? "text-(--sidebar-accent)"
                            : "text-(--sidebar-text-muted) group-hover:text-(--sidebar-text)",
                        )}
                      />
                      {collapsed ? (
                        badge ? (
                          <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-(--sidebar-accent)" />
                        ) : null
                      ) : (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {badge ? (
                            <span className="rounded-full bg-(--sidebar-accent) px-1.5 py-0.5 text-[10px] font-semibold leading-none text-(--sidebar-accent-foreground)">
                              {badge}
                            </span>
                          ) : null}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-(--sidebar-border) p-3">
        <div
          className={cn(
            "flex min-h-14 items-center gap-3 rounded-md bg-(--sidebar-elevated) px-3 py-2",
            collapsed && "flex-col gap-2 px-0 py-2",
          )}
        >
          <span
            title={collapsed ? name : undefined}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--sidebar-accent) text-xs font-semibold text-(--sidebar-accent-foreground)"
          >
            {initials}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{name}</p>
              <p className="truncate text-xs text-(--sidebar-text-muted)">
                {user?.role ?? "Admin"}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sign out"
            title="Sign out"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-(--sidebar-text-muted) transition-colors hover:bg-(--sidebar-active) hover:text-white"
          >
            <LogoutIcon width={16} height={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
