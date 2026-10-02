import { useQuery } from '@tanstack/react-query';
import { rolesQueryOptions, type RoleRow, type RoleListResponse } from '../api/roles';
import type { AdminListRolesStatus } from '../../../sdk/schemas';

// The SDK mutator wraps every response as { data, status, headers }; unwrap it
// here the same way the other admin features do (see useActivityLog / useUsers).
interface RolesEnvelope {
  data: RoleListResponse;
  status: number;
}

export interface UseRolesArgs {
  /** 0-based page index. */
  page: number;
  /** Rows per page (maps to `limit`). */
  pageSize: number;
  /** Free-text search on role name (server-side). */
  q?: string;
  /** Status filter; `'all'` means no status filter. */
  status?: 'all' | 'active' | 'inactive';
  /** Role-type (tier) filter; `'all'` means no type filter. */
  type?: 'all' | 'admin' | 'staff';
}

export function useRoles({ page, pageSize, q, status = 'all', type = 'all' }: UseRolesArgs) {
  // Search, status, type AND pagination are all handled server-side. The list
  // API has no sort param, so there is no sort/order wiring here (research D2).
  const query = useQuery(
    rolesQueryOptions({
      limit: pageSize,
      offset: page * pageSize,
      q: q?.trim() || undefined,
      status: status === 'all' ? undefined : (status as AdminListRolesStatus),
      type: type === 'all' ? undefined : type,
    }),
  );
  const envelope = query.data as RolesEnvelope | undefined;
  const roles: RoleRow[] = envelope?.data.items ?? [];

  return {
    roles,
    total: envelope?.data.total ?? 0,
    isLoading: query.isPending || query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
