/**
 * Single source of the nav-path→permission mapping (feature 039, realigned 068).
 *
 * Consumed by the navigation (which tab to show) and by `firstPermittedPath`
 * (post-login landing). Route guards live as literals in `routes.tsx` — the old
 * `ROUTE_PERMISSION` mirror was dead code (nothing consumed it) and was removed
 * in 068 so it can't silently drift from the real guards.
 *
 * A value may be an ARRAY of permissions, meaning the user needs ANY one of them
 * (e.g. `/sales-orders` is reachable by either sales OR inventory viewers because
 * its Dispatch/Invoices tabs are inventory-gated — feature: unified sales tabs).
 */
import type { Permission } from './permission-keys';

/** One permission, or a set the user needs ANY of. */
export type PermissionRequirement = Permission | Permission[];

/** Nav path → permission required to SEE the tab. */
export const NAV_PERMISSION: Record<string, PermissionRequirement> = {
  '/dashboard': 'dashboard.view',
  '/patients': 'patients.view',
  '/ai-summary': 'ai_summary.view',
  // Add one line per screen as it lands, e.g. '/students': 'students.view'.
};

/** Nav paths in display order — used by landing resolution (firstPermittedPath). */
export const NAV_ORDER: string[] = ['/dashboard', '/patients', '/ai-summary'];
