/**
 * Reads the double-submit CSRF token the backend writes to the
 * non-HttpOnly `csrf_token` cookie. The fetch interceptor in
 * `./client.ts` echoes it back as the `X-CSRF-Token` header on every
 * state-changing request. See backend contracts/auth-api.md.
 *
 * **FR-018 constraint**: this module MUST only be imported by the central
 * fetcher (`./client.ts`). Feature code, routes, and pages MUST NOT call
 * `getCsrfToken()` directly — every state-changing call flows through
 * `apiFetch` / `apiFetchWithMeta`, which handle the header injection.
 * Audited as part of specs/004-frontend-orval-sdk T039.
 */

const CSRF_COOKIE_NAME = 'csrf_token';

export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const c of cookies) {
    const eq = c.indexOf('=');
    if (eq < 0) continue;
    if (c.slice(0, eq) === CSRF_COOKIE_NAME) {
      return decodeURIComponent(c.slice(eq + 1));
    }
  }
  return null;
}
