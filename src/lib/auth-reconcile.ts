import { ApiError } from '../api/client';

/**
 * True when an error is a server "forbidden" (403) — used to reconcile a stale
 * local permission set (feature 039, FR-023). The backend is the authority: if a
 * mutation 403s because the user's grants changed mid-session, the UI surfaces a
 * message and refetches `/auth/me` so subsequent UI reflects the current grants.
 */
export function isPermissionDenied(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}
