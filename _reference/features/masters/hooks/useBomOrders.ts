import { useQuery } from '@tanstack/react-query';
import type { MastersListQuery } from '../api/list-query';
import { bomOrdersQueryOptions, type BomOrderRow } from '../api/bom-orders';

interface Envelope {
  data: { results: BomOrderRow[]; count: number };
  status: number;
}

export function useBomOrders(query: MastersListQuery & { status?: string }) {
  const result = useQuery({ ...bomOrdersQueryOptions(query), placeholderData: (prev) => prev });
  const envelope = result.data as Envelope | undefined;
  const orders: BomOrderRow[] = envelope?.data.results ?? [];

  return {
    orders,
    count: envelope?.data.count ?? 0,
    isLoading: result.isPending,
    refetch: result.refetch,
  };
}
