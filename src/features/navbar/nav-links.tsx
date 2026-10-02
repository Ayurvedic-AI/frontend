import type { ReactNode } from 'react';
import { Home, Sparkles, Users } from 'lucide-react';

export interface NavLink {
  label: string;
  path: string;
  icon: ReactNode;
}

export interface NavGroup {
  heading: string;
  links: NavLink[];
}

const ICON = 'size-[18px]';

/**
 * Top-bar navigation, grouped. Add a link here when its screen exists (see
 * `.claude/skills/new-feature-screen`). Planned Ayurveda AI links, in order:
 *   Clinic         → Consultations, Ashtavidha Pariksha, Verse Search
 *   Administration → Users, Roles & Permissions, Settings
 * Each path also needs an entry in `features/auth/permissions/permission-map.ts`.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'Clinic',
    links: [
      { label: 'Dashboard', path: '/dashboard', icon: <Home className={ICON} /> },
      { label: 'Patients', path: '/patients', icon: <Users className={ICON} /> },
      { label: 'AI Summary', path: '/ai-summary', icon: <Sparkles className={ICON} /> },
    ],
  },
];

/** Flat list (used by the mobile drawer). */
export const NAV_LINKS: NavLink[] = NAV_GROUPS.flatMap((group) => group.links);

/** Every registered nav path, used to resolve the most-specific active item. */
export const ALL_NAV_PATHS: string[] = NAV_LINKS.map((link) => link.path);

/**
 * Whether a nav item should render as active for the current pathname.
 * Exact match always wins. A prefix match (so `/students/:id` keeps Students
 * active) only counts when no other nav item is a more specific match.
 */
export function isNavPathActive(
  pathname: string,
  path: string,
  allPaths: string[] = ALL_NAV_PATHS,
): boolean {
  if (pathname === path) return true;
  if (!pathname.startsWith(`${path}/`)) return false;
  return !allPaths.some(
    (other) =>
      other !== path &&
      other.startsWith(`${path}/`) &&
      (pathname === other || pathname.startsWith(`${other}/`)),
  );
}
