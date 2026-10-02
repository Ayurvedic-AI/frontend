import { useQuery } from '@tanstack/react-query';
import {
  activityLogQueryOptions,
  type AuditRow,
  type AuditLogListResponse,
} from '../api/activity-log';

// The SDK mutator wraps every response as { data, status, headers }; unwrap it
// here the same way the Users feature does.
interface AuditEnvelope {
  data: AuditLogListResponse;
  status: number;
}

export interface UseActivityLogArgs {
  page: number;
  pageSize: number;
  /** Free-text search (server-side: actor / action / entity / record). */
  q?: string;
  /** Column id to sort by (when | who | action | entity | record | ip). */
  sort?: string;
  order?: 'asc' | 'desc';
}

export function useActivityLog({ page, pageSize, q, sort, order }: UseActivityLogArgs) {
  // Search, sort AND pagination are all handled server-side.
  const query = useQuery(
    activityLogQueryOptions({
      limit: pageSize,
      offset: page * pageSize,
      q: q?.trim() || undefined,
      sort: sort || undefined,
      order: sort ? order : undefined,
    }),
  );
  const envelope = query.data as AuditEnvelope | undefined;
  const entries: AuditRow[] = envelope?.data.items ?? [];
  const total = envelope?.data.total ?? 0;

  return {
    entries,
    total,
    isLoading: query.isPending || query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
