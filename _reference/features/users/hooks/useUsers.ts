import { useQuery } from '@tanstack/react-query';
import {
  usersQueryOptions,
  type UserRow,
  type AdminUserList,
  type UsersQueryArgs,
} from '../api/users';

// The SDK mutator wraps every response as { data, status, headers }; unwrap it
// here. The admin Users list payload is { items, total, limit, offset }.
interface UsersEnvelope {
  data: AdminUserList;
  status: number;
}

export function useUsers(args: UsersQueryArgs) {
  // Search, status/role filtering, sort AND pagination are all server-side.
  const query = useQuery(usersQueryOptions(args));
  const envelope = query.data as UsersEnvelope | undefined;
  const users: UserRow[] = envelope?.data.items ?? [];
  const total = envelope?.data.total ?? 0;

  return {
    users,
    total,
    // Include isFetching so page/sort/filter transitions show the loading state.
    isLoading: query.isPending || query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
