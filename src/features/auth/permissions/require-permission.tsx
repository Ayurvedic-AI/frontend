import type { ReactNode } from 'react';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { usePermissions } from './use-permissions';

interface RequirePermissionProps {
  /** Single catalog permission required to open the wrapped route. */
  permission?: string;
  /** Alternative: any ONE of these permissions opens the route (OR-gating). */
  anyOf?: string[];
  children: ReactNode;
}

/**
 * Route guard (feature 039, FR-013/FR-015).
 *
 * Renders the route when the user holds `permission` (or any of `anyOf`),
 * otherwise renders the in-app 403 page in place (no redirect, URL stays honest,
 * protected content never mounts). Auth resolves first via the outer
 * ProtectedRoute, so by the time this runs the permission set is already known —
 * no flash.
 */
export function RequirePermission({ permission, anyOf, children }: RequirePermissionProps) {
  const { has, hasAny } = usePermissions();
  const allowed = anyOf ? hasAny(anyOf) : permission != null && has(permission);
  if (!allowed) return <ForbiddenPage />;
  return <>{children}</>;
}

export default RequirePermission;
