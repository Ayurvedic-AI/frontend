/**
 * Central permission mechanism (feature 039).
 *
 * Reads the effective permission set delivered once on `/auth/me` (cached in
 * AuthContext) and answers every access decision from that in-memory `Set` —
 * NO per-navigation network call (FR-005/FR-006). This replaces the seven
 * legacy per-feature `use*Permissions` hooks.
 */
import { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import type { Action, Feature } from './permission-keys';

export interface PermissionApi {
  /** True if the user holds this exact permission string. */
  has: (permission: string) => boolean;
  /** True if the user holds at least one of these permissions. */
  hasAny: (permissions: string[]) => boolean;
  /** True if the user holds all of these permissions. */
  hasAll: (permissions: string[]) => boolean;
  /** True if the user holds `${feature}.${action}`. */
  can: (feature: Feature | string, action: Action) => boolean;
  canView: (feature: Feature | string) => boolean;
  canCreate: (feature: Feature | string) => boolean;
  canUpdate: (feature: Feature | string) => boolean;
  canDelete: (feature: Feature | string) => boolean;
  /** The raw effective permission set (read-only). */
  permissions: ReadonlySet<string>;
}

/**
 * Pure factory — builds the permission API from any permission iterable.
 * Exported for unit testing without React.
 */
export function createPermissionApi(permissions: Iterable<string>): PermissionApi {
  const set = permissions instanceof Set ? permissions : new Set(permissions);
  const has = (permission: string): boolean => set.has(permission);
  const can = (feature: Feature | string, action: Action): boolean =>
    set.has(`${feature}.${action}`);
  return {
    has,
    hasAny: (perms) => perms.some(has),
    hasAll: (perms) => perms.every(has),
    can,
    canView: (feature) => can(feature, 'view'),
    canCreate: (feature) => can(feature, 'create'),
    canUpdate: (feature) => can(feature, 'update'),
    canDelete: (feature) => can(feature, 'delete'),
    permissions: set,
  };
}

/** React hook: the current user's permission API, memoised on the delivered set. */
export function usePermissions(): PermissionApi {
  const { user } = useAuth();
  const permissions = user?.permissions;
  return useMemo(() => createPermissionApi(permissions ?? []), [permissions]);
}
