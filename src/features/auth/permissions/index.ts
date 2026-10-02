/** Central permission layer (feature 039) — public surface. */
export type { Action, Feature, Permission } from './permission-keys';
export { permissionName } from './permission-keys';
export { NAV_PERMISSION, NAV_ORDER } from './permission-map';
export { usePermissions, createPermissionApi, type PermissionApi } from './use-permissions';
export { firstPermittedPath } from './landing';
export { RequirePermission } from './require-permission';
export { PermissionButton, type PermissionButtonProps } from './permission-button';
export { PermissionGate } from './permission-gate';
