"use client";

import { useEffect } from "react";
import { requestFcmToken, onForegroundMessage, setCachedFcmToken } from "@/lib/firebase";
import { notificationsApi } from "@/lib/notifications";
import { getToken } from "@/lib/api";
import { invalidate, resourcesForPush } from "@/lib/data-refresh";
import { useUnreadCount } from "@/lib/use-unread-count";

/**
 * Requests push permission, then registers the FCM device token with the API so
 * the backend can target this browser. Without this the token never leaves the
 * client and broadcasts reach no devices.
 * On foreground push, bumps the unread badge and shows a native notification.
 */
export function FcmListener() {
  const { refresh } = useUnreadCount();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Registration is authenticated — skip it entirely when signed out.
    if (!getToken()) return;

    requestFcmToken()
      .then(async (token) => {
        if (!token) return;
        // Deliberately not guarded by an "is this effect still mounted" flag:
        // requestFcmToken() outlives StrictMode's throwaway first mount, and
        // bailing out there would drop the registration entirely. The backend
        // upserts, so registering again on the real mount is harmless.
        await notificationsApi.registerDevice(token);
        setCachedFcmToken(token);
      })
      .catch((err) => console.error("[fcm] device registration failed:", err));

    onForegroundMessage((payload) => {
      refresh();
      // Refetch whichever lists this push made stale (e.g. a portfolio
      // submission re-runs the artists list so the Pending review tab updates).
      invalidate(...resourcesForPush(payload));

      const { title, body, icon } = payload.notification ?? {};
      if (Notification.permission === "granted" && title) {
        new Notification(title, { body, icon: icon ?? "/icon.png" });
      }
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    // Pushes that land while the tab is hidden are handled by the service
    // worker, so the page never sees them — resync when it comes back.
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      refresh();
      invalidate("artists", "users", "support", "notifications");
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      unsubscribe?.();
    };
  }, [refresh]);

  return null;
}
