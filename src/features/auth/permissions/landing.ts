/**
 * Landing resolution (feature 039, FR-016).
 *
 * Picks the first navigation destination the user is allowed to view, in nav
 * order. Returns `null` when the user can view nothing — the caller then shows
 * the dedicated no-access screen instead of looping on a blocked default.
 */
import { NAV_ORDER, NAV_PERMISSION } from './permission-map';

export function firstPermittedPath(permissions: ReadonlySet<string>): string | null {
  for (const path of NAV_ORDER) {
    const required = NAV_PERMISSION[path];
    if (!required) return path;
    const ok = Array.isArray(required)
      ? required.some((p) => permissions.has(p))
      : permissions.has(required);
    if (ok) return path;
  }
  return null;
}
