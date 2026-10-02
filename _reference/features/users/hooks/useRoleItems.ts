import { useAdminListAssignableRoles } from '../../../sdk/user-management';
import type { UserRoleOption } from '../../../sdk/schemas';

export interface RoleSelectItem {
  value: string;
  label: string;
}

interface UseRoleItemsResult {
  /** Roles the current manager may assign — for the create/edit pickers. */
  roleItems: RoleSelectItem[];
  /** Every active role — for the Users table role filter. */
  allRoleItems: RoleSelectItem[];
  isLoading: boolean;
}

/** "super_admin" → "Super Admin". Derived from the stable role name so an
 *  edited/garbage free-text description can't mislabel the dropdown option. */
export function roleLabel(name: string): string {
  return name
    .split('_')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');
}

export function useRoleItems(): UseRoleItemsResult {
  // Sourced from the user-management endpoint (gated by users.view), NOT the
  // roles list (roles.view) — so a user-manager without roles.view still gets a
  // populated dropdown (#103). `assignable` honours the admin-tier guard (INV-2).
  const query = useAdminListAssignableRoles();
  const envelope = query.data as { data: UserRoleOption[] } | undefined;
  const roles = envelope?.data ?? [];
  const toItem = (r: UserRoleOption): RoleSelectItem => ({ value: r.name, label: roleLabel(r.name) });

  // The base "user" role isn't offered for a fresh assignment (matches the
  // create-only era); the edit drawer re-adds the current role if needed.
  const roleItems = roles.filter((r) => r.assignable && r.name !== 'user').map(toItem);
  const allRoleItems = roles.map(toItem);

  return { roleItems, allRoleItems, isLoading: query.isLoading };
}
