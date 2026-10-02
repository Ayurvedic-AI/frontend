import { ApiError } from '../api/client';

/**
 * Message to show for a failed API call. Prefers the backend's `detail`
 * (this API returns `{ detail: "…" }` on domain errors); otherwise a fallback.
 */
export function errorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof ApiError) {
    const detail = (error as unknown as { body?: { detail?: unknown } }).body?.detail;
    if (typeof detail === 'string') return detail;
  }
  return fallback;
}

/**
 * Per-item breakdown for a domain error (e.g. one line per short product),
 * when the backend attaches `{ violations: string[] }` alongside `detail`
 * (already used for password-policy failures; `UnprocessableError`
 * populates it for any 422 that has more than one thing to say).
 */
export function errorViolations(error: unknown): string[] {
  if (error instanceof ApiError) {
    const violations = (error as unknown as { body?: { violations?: unknown } }).body?.violations;
    if (Array.isArray(violations)) return violations.filter((v): v is string => typeof v === 'string');
  }
  return [];
}

/**
 * Message to show for a successful mutation. Prefers the backend's `message`
 * if present (the SDK wraps responses as `{ data, status }`); otherwise the
 * given fallback. Centralised so the day the backend returns success messages,
 * every toast picks them up automatically.
 */
export function successMessage(response: unknown, fallback: string): string {
  const message = (response as { data?: { message?: unknown } } | undefined)?.data?.message;
  return typeof message === 'string' ? message : fallback;
}
