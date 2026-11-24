import { firebaseConfig } from "@/lib/firebase";

/**
 * Serves the FCM service worker from a route rather than `public/` so its
 * Firebase config comes from the same env vars as the client SDK — files in
 * `public/` are served verbatim and cannot read `process.env`.
 *
 * Must stay reachable at the root scope (`/firebase-messaging-sw.js`); FCM
 * registers it by that exact path.
 */
export const dynamic = "force-static";

export function GET() {
  const body = `
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp(${JSON.stringify(firebaseConfig)});

const messaging = firebase.messaging();

// Take over without waiting for a reload — otherwise an old SW keeps handling pushes.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {};
  self.registration.showNotification(title ?? "Adlora", {
    body,
    icon: icon ?? "/icon.png",
  });
});
`.trimStart();

  return new Response(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // The SW must not be cached, or config changes never reach browsers.
      "Cache-Control": "no-store, max-age=0",
      "Service-Worker-Allowed": "/",
    },
  });
}
