/**
 * Tiny `fetch` wrapper that:
 *  - prepends `VITE_API_BASE_URL` to relative paths
 *  - always sends `credentials: 'include'` so the auth cookies attach
 *  - injects the `X-CSRF-Token` header on every non-GET/HEAD request,
 *    reading the value from the `csrf_token` cookie (see `./csrf.ts`)
 *
 * Errors surface as `ApiError` with `status` + parsed JSON body, which the
 * RHF-error helpers and toast layer already know how to read.
 */
import { getCsrfToken } from './csrf';

// BASE_URL is the host-only origin (no `/api/v1` prefix). Each call site
// passes the full path (e.g., '/api/v1/auth/login') — this matches Orval's
// generated SDK paths, which include the prefix straight from the OpenAPI
// document. When the env var is unset (production build, etc.), paths fall
// through as same-origin requests.
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export interface ApiRequest extends Omit<RequestInit, 'body' | 'method'> {
  method?: string;
  body?: BodyInit | Record<string, unknown> | URLSearchParams | null;
  /** Mark the request as "form-encoded" — useful for /auth/login. */
  form?: boolean;
}

/**
 * Response envelope used by `apiFetchWithMeta` and the SDK mutator. Matches
 * Orval's `*Response = {data, status, headers}` discriminated-union members
 * so the generated SDK's types are accurate at runtime.
 */
export interface ApiResponseEnvelope<T> {
  data: T;
  status: number;
  headers: Headers;
}

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function serializeBody(body: ApiRequest['body'], form: boolean | undefined): {
  body: BodyInit | null;
  contentType: string | null;
} {
  if (body == null) return { body: null, contentType: null };
  if (body instanceof FormData) return { body, contentType: null };
  if (body instanceof URLSearchParams) {
    return { body, contentType: 'application/x-www-form-urlencoded' };
  }
  if (form && typeof body === 'object') {
    const usp = new URLSearchParams(body as Record<string, string>);
    return { body: usp, contentType: 'application/x-www-form-urlencoded' };
  }
  if (typeof body === 'string') {
    return { body, contentType: 'application/json' };
  }
  return { body: JSON.stringify(body), contentType: 'application/json' };
}

// Path of the silent-refresh endpoint. The access cookie lives only ~15 min;
// when it expires the server replies 401, and we transparently exchange the
// long-lived refresh cookie for a fresh access cookie via this endpoint.
const REFRESH_PATH = '/api/v1/auth/refresh';

// 401s from these auth-flow endpoints are terminal — never try to refresh them
// (a failed login/logout/refresh must surface as-is, not loop).
const NO_REFRESH_PATHS = ['/auth/login', '/auth/logout', '/auth/refresh'];

function shouldAttemptRefresh(path: string): boolean {
  return !NO_REFRESH_PATHS.some((p) => path.includes(p));
}

/**
 * Single core request — no 401 handling. Returns the response envelope or
 * throws `ApiError`. `apiFetchWithMeta` wraps this with the refresh retry.
 */
async function rawFetchWithMeta<T = unknown>(
  path: string,
  init: ApiRequest = {},
): Promise<ApiResponseEnvelope<T>> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  const { body, contentType } = serializeBody(init.body, init.form);
  if (contentType && !headers.has('Content-Type')) headers.set('Content-Type', contentType);

  // CSRF: every non-safe method gets the header (if the cookie exists).
  if (!SAFE_METHODS.has(method)) {
    const token = getCsrfToken();
    if (token && !headers.has('X-CSRF-Token')) headers.set('X-CSRF-Token', token);
  }

  const resp = await fetch(buildUrl(path), {
    ...init,
    method,
    headers,
    body,
    credentials: 'include',
  });

  let parsed: unknown = undefined;
  if (resp.status !== 204) {
    const text = await resp.text();
    parsed = text;
    if (text.length > 0) {
      try {
        parsed = JSON.parse(text);
      } catch {
        // leave as string
      }
    }
  }

  if (!resp.ok) {
    throw new ApiError(resp.status, parsed);
  }

  return { data: parsed as T, status: resp.status, headers: resp.headers };
}

// Single-flight guard: when many requests 401 at once (e.g. a dashboard firing
// several queries after the access cookie expired), they all await ONE refresh
// instead of stampeding the endpoint.
let refreshPromise: Promise<boolean> | null = null;

// Cross-tab lock name. The backend rotates the refresh token on every use and
// treats reuse of a rotated token as theft (it revokes the whole session
// chain). The module-level guard above only dedupes within one tab, so two
// tabs hitting the 15-min expiry together would race /auth/refresh and the
// loser would trigger that revocation. The Web Locks API serializes the
// refresh across all tabs of the origin; where unavailable (non-secure
// context, old browser), we fall back to the per-tab guard alone and rely on
// the server's concurrent-refresh grace window.
const REFRESH_LOCK_NAME = 'svm-auth-refresh';

function withCrossTabLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (locks?.request) {
    return locks.request(REFRESH_LOCK_NAME, fn) as Promise<T>;
  }
  return fn();
}

function ensureRefreshed(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = withCrossTabLock(() =>
      // By the time the lock is granted another tab may already have rotated
      // the cookies; refreshing again with the (shared, now-current) cookie
      // is still a valid rotation, so no staleness check is needed.
      rawFetchWithMeta(REFRESH_PATH, { method: 'POST' })
        .then(() => true)
        .catch(() => false),
    )
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * Lower-level request that returns the response envelope (`data`, `status`,
 * `headers`). Used by the SDK mutator (`./sdk-mutator.ts`) so that Orval's
 * generated discriminated-union return types are honoured at runtime.
 *
 * On a 401 it transparently attempts ONE silent refresh and retries the
 * original request, so a brand-new tab (or a session whose 15-min access token
 * lapsed) heals itself instead of bouncing the user to /login.
 */
export async function apiFetchWithMeta<T = unknown>(
  path: string,
  init: ApiRequest = {},
): Promise<ApiResponseEnvelope<T>> {
  try {
    return await rawFetchWithMeta<T>(path, init);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && shouldAttemptRefresh(path)) {
      const refreshed = await ensureRefreshed();
      if (refreshed) {
        // Exactly one retry — rawFetch (not the wrapper) so this can't recurse.
        return await rawFetchWithMeta<T>(path, init);
      }
    }
    throw err;
  }
}

/**
 * Unwrapped flavour. Most application code uses this — it returns just the
 * parsed body. The SDK mutator uses `apiFetchWithMeta` instead.
 */
export async function apiFetch<T = unknown>(
  path: string,
  init: ApiRequest = {},
): Promise<T> {
  const { data } = await apiFetchWithMeta<T>(path, init);
  return data;
}
