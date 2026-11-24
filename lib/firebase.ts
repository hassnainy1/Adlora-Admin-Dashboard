import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";

/**
 * Shared by the client SDK and the generated service worker
 * (`app/firebase-messaging-sw.js/route.ts`) — both must initialize the same
 * Firebase project or background pushes are silently dropped.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

function getFirebaseApp(): FirebaseApp {
  return getApps()[0] ?? initializeApp(firebaseConfig);
}

let messagingPromise: Promise<Messaging | null> | null = null;

/** Resolves to null in SSR/unsupported browsers (e.g. no SW/push support). */
function getFirebaseMessaging(): Promise<Messaging | null> {
  if (!messagingPromise) {
    messagingPromise = isSupported().then((supported) =>
      supported ? getMessaging(getFirebaseApp()) : null,
    );
  }
  return messagingPromise;
}

const FCM_TOKEN_KEY = "adlora.fcmToken";

/** Last token handed to the backend — needed to unregister it on logout. */
export function getCachedFcmToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(FCM_TOKEN_KEY);
}

export function setCachedFcmToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(FCM_TOKEN_KEY, token);
  else localStorage.removeItem(FCM_TOKEN_KEY);
}

/**
 * Requests browser notification permission and fetches the FCM device token.
 * Callers are responsible for persisting it via `notificationsApi.registerDevice`.
 */
export async function requestFcmToken(): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
  );
  // getToken() silently fails against a SW that is registered but not yet active.
  await navigator.serviceWorker.ready;

  return getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
}

/** Subscribes to push messages received while the app has focus. Returns an unsubscribe fn. */
export async function onForegroundMessage(
  callback: (payload: MessagePayload) => void,
): Promise<() => void> {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}
