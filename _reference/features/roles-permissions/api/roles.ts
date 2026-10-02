// Data access for the Roles & Permissions feature. Single entry point onto the
// generated SDK (`adminListRoles` / `adminGetRole` / `adminListPermissions`).
import {
  getAdminListRolesQueryOptions,
  getAdminGetRoleQueryOptions,
  getAdminListPermissionsQueryOptions,
} from '../../../sdk/roles-permissions';
import type {
  RoleOut,
  RoleDetailOut,
  RoleList,
  PermissionOut,
  FeatureRow,
  ActionCell,
  AdminListRolesParams,
} from '../../../sdk/schemas';

export type RoleRow = RoleOut;
export type RoleListResponse = RoleList;
export type PermissionItem = PermissionOut;
export type { RoleDetailOut, FeatureRow, ActionCell, AdminListRolesParams };

/** TanStack Query options for `GET /api/v1/admin/roles` (search/status/pagination). */
export function rolesQueryOptions(params: AdminListRolesParams) {
  return getAdminListRolesQueryOptions(params);
}

/** TanStack Query options for `GET /api/v1/admin/roles/{roleUuid}` (full matrix). */
export function roleDetailQueryOptions(roleUuid: string) {
  return getAdminGetRoleQueryOptions(roleUuid);
}

/** TanStack Query options for `GET /api/v1/admin/permissions` (the catalog). */
export function permissionsQueryOptions() {
  return getAdminListPermissionsQueryOptions();
}
