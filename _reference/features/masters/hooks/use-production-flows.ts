import { useQuery } from '@tanstack/react-query';
import { getAdminListProductionFlowsQueryOptions } from '../../../sdk/inventory';
import type { ProductionFlowItem } from '../../../sdk/schemas';

/** Production Flows master (072 dynamic): the full list (small reference set). */
export function useProductionFlows() {
  const query = useQuery(getAdminListProductionFlowsQueryOptions());
  const data = (query.data as { data?: { results?: ProductionFlowItem[]; count?: number } } | undefined)?.data;
  return {
    flows: data?.results ?? [],
    count: data?.count ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
