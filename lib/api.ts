const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3034/api/").replace(/\/?$/, "/");
/** API origin without the trailing `/api/`, e.g. "http://127.0.0.1:3034". */
const API_ORIGIN = API_URL.replace(/api\/?$/, "").replace(/\/$/, "");

/**
 * Resolves a server-relative media path (e.g. "/uploads/images/x.jpg") into
 * an absolute URL against `NEXT_PUBLIC_API_URL`'s origin.
 */
export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const rel = path.startsWith("/") ? path : `/${path}`;
  return `${API_ORIGIN}${rel}`;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  /** Field-level validation errors, keyed by field (e.g. "body.answer"). */
  errors?: Record<string, string[]>;
  meta?: Record<string, unknown>;
  pagination?: Pagination;
}

/** Full envelope for callers that need `pagination`/`message` alongside `data` (apiFetch discards both). */
export interface ApiEnvelope<T> {
  data: T;
  pagination?: Pagination;
  message?: string;
}

/** Pull the first field-level validation message, if any. */
function firstFieldError(errors?: Record<string, string[]>): string | null {
  if (!errors) return null;
  for (const messages of Object.values(errors)) {
    if (Array.isArray(messages) && messages.length) return messages[0];
  }
  return null;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = typeof window !== "undefined" ? getToken() : null;

  // Let the browser set its own multipart boundary for FormData bodies.
  const isFormData = init.body instanceof FormData;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path.replace(/^\//, "")}`, {
      ...init,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError("Cannot reach the server. Is the API running?", 0);
  }

  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;

  if (!res.ok || !body?.success) {
    const message =
      firstFieldError(body?.errors) ??
      body?.error ??
      body?.message ??
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return body;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const body = await request<T>(path, init);
  return body.data as T;
}

/** Like `apiFetch`, but keeps `pagination`/`message` instead of discarding them. */
export async function apiFetchEnvelope<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiEnvelope<T>> {
  const body = await request<T>(path, init);
  return { data: body.data as T, pagination: body.pagination, message: body.message };
}

/**
 * Fetches a binary response (e.g. `format=csv` exports) with the same auth
 * header as `apiFetch`, then triggers a browser download.
 */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const token = typeof window !== "undefined" ? getToken() : null;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path.replace(/^\//, "")}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new ApiError("Cannot reach the server. Is the API running?", 0);
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiResponse<unknown> | null;
    throw new ApiError(body?.error ?? body?.message ?? `Request failed (${res.status})`, res.status);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const TOKEN_KEY = "adlora.token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string, remember: boolean) {
  clearToken();
  (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}
