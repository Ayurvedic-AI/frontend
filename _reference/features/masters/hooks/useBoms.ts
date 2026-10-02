import { useQuery } from '@tanstack/react-query';
import type { MastersListQuery } from '../api/list-query';
import { bomsQueryOptions, type BomRow, type BomListResponse } from '../api/boms';

interface Envelope {
  data: BomListResponse;
  status: number;
}

export function useBoms(
  query: MastersListQuery,
  options?: { enabled?: boolean; kind?: 'product' | 'sfg' },
) {
  const result = useQuery({
    ...bomsQueryOptions(query, { kind: options?.kind }),
    placeholderData: (prev) => prev,
    enabled: options?.enabled ?? true,
  });
  const envelope = result.data as Envelope | undefined;
  const boms: BomRow[] = envelope?.data.results ?? [];

  return {
    boms,
    count: envelope?.data.count ?? 0,
    isLoading: result.isPending,
    refetch: result.refetch,
  };
}
