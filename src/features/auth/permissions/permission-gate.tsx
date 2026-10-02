import type { ReactNode } from 'react';
import { usePermissions } from './use-permissions';

interface PermissionGateProps {
  /** The catalog permission required. */
  permission: string;
  /**
   * `hide` (default) — render children only when permitted (render `fallback`
   * otherwise). `disable` — always render children, but make them visually
   * disabled and inert when not permitted.
   */
  mode?: 'hide' | 'disable';
  children: ReactNode;
  /** Rendered in place of children when hidden (mode="hide"). */
  fallback?: ReactNode;
}

/**
 * Permission gate for non-button controls (feature 039).
 *
 * Most action controls should use {@link PermissionButton}; this covers the rarer
 * cases (whole sections, links, custom controls) that need hide-or-disable.
 */
export function PermissionGate({ permission, mode = 'hide', children, fallback = null }: PermissionGateProps) {
  const { has } = usePermissions();
  if (has(permission)) return <>{children}</>;
  if (mode === 'hide') return <>{fallback}</>;
  return (
    <span className="pointer-events-none opacity-50" aria-disabled data-slot="permission-disabled">
      {children}
    </span>
  );
}

export default PermissionGate;
