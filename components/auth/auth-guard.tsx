"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/api";

/**
 * Token lives in web storage, so route protection happens on the client:
 * AuthGuard gates the dashboard, GuestGuard keeps signed-in users off /login.
 * Children stay hidden until the redirect decision is made to avoid flashing.
 */

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function useAuthToken() {
  return useSyncExternalStore(subscribe, getToken, () => null);
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const token = useAuthToken();

  useEffect(() => {
    // Read storage directly: during hydration `token` is still the server
    // snapshot (null), which would wrongly bounce hard-loads to /login.
    if (!getToken()) router.replace("/login");
  }, [token, router]);

  if (!token) return null;
  return <>{children}</>;
}

export function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const token = useAuthToken();

  useEffect(() => {
    if (getToken()) router.replace("/");
  }, [token, router]);

  if (token) return null;
  return <>{children}</>;
}
