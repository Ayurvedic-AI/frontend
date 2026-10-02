/**
 * Permission-filtered navigation (feature 039).
 *
 * Hides a nav item when the user lacks its required view permission, and drops a
 * group whose every item is hidden (FR-009/FR-011). The required permission per
 * path comes from the single `NAV_PERMISSION` map (data-model §3) — the same map
 * the route guard uses — so nav visibility and route access never drift. A path
 * with no mapping entry is shown by default.
 */
import { useMemo } from 'react';
import { usePermissions } from '../auth/permissions';
import { NAV_PERMISSION } from '../auth/permissions/permission-map';
import { NAV_GROUPS, type NavGroup, type NavLink } from './nav-links';

/** Nav groups with unpermitted items removed and empty groups dropped. */
export function useVisibleNavGroups(): NavGroup[] {
  const { has } = usePermissions();
  return useMemo(() => {
    const visible = (path: string): boolean => {
      const required = NAV_PERMISSION[path];
      if (!required) return true;
      return Array.isArray(required) ? required.some(has) : has(required);
    };
    return NAV_GROUPS.map((group) => ({
      ...group,
      links: group.links.filter((link) => visible(link.path)),
    })).filter((group) => group.links.length > 0);
  }, [has]);
}

/** Flat list of permitted nav links (used by the mobile drawer). */
export function useVisibleNavLinks(): NavLink[] {
  const groups = useVisibleNavGroups();
  return useMemo(() => groups.flatMap((group) => group.links), [groups]);
}
