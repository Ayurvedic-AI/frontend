import { useQuery } from '@tanstack/react-query';
import { roleDetailQueryOptions, type RoleDetailOut } from '../api/roles';

// The SDK mutator wraps every response as { data, status, headers }; unwrap it
// the same way useRoles does.
interface RoleDetailEnvelope {
  data: RoleDetailOut;
  status: number;
}

/**
 * Full single-role view including the catalog matrix (granted/not-granted).
 * The query is disabled while `roleUuid` is undefined (e.g. on the detail page
 * before the route param resolves).
 */
export function useRoleDetail(roleUuid: string | undefined) {
  const query = useQuery({
    ...roleDetailQueryOptions(roleUuid ?? ''),
    enabled: Boolean(roleUuid),
  });
  const envelope = query.data as RoleDetailEnvelope | undefined;

  return {
    role: envelope?.data,
    isLoading: query.isPending || query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
