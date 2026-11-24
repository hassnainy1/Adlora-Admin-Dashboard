import { apiFetch, setToken, clearToken } from "@/lib/api";
import { getCachedFcmToken, setCachedFcmToken } from "@/lib/firebase";
import { notificationsApi } from "@/lib/notifications";

export interface AuthUser {
  id: number;
  uuid: string | null;
  status: string;
  email: string;
  isVerified: boolean;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResult {
  user: AuthUser;
  token: string;
}

const USER_KEY = "adlora.user";

export async function login(email: string, password: string, remember: boolean): Promise<LoginResult> {
  const result = await apiFetch<LoginResult>("users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  setToken(result.token, remember);
  localStorage.setItem(USER_KEY, JSON.stringify(result.user));

  return result;
}

export function logout() {
  // Fire-and-forget: these requests need the auth token, so they must start
  // before clearToken(), but logout must not wait on (or fail from) them.
  const fcmToken = getCachedFcmToken();
  apiFetch("users/logout", {
    method: "POST",
    body: JSON.stringify(fcmToken ? { token: fcmToken } : {}),
  }).catch(() => {});

  if (fcmToken) {
    notificationsApi.unregisterDevice(fcmToken).catch(() => {});
    setCachedFcmToken(null);
  }

  clearToken();
  localStorage.removeItem(USER_KEY);
}

export function getCurrentUser(): AuthUser | null {
  const raw = getCurrentUserRaw();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

// Raw string accessor so useSyncExternalStore gets a stable snapshot
// (parsing in the snapshot would return a new object every call).
export function getCurrentUserRaw(): string | null {
  return localStorage.getItem(USER_KEY);
}
