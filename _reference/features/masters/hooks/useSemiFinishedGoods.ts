import { useQuery } from '@tanstack/react-query';
import type { MastersListQuery } from '../api/list-query';
import {
  semiFinishedGoodsQueryOptions,
  type SemiFinishedGoodRow,
  type SemiFinishedGoodListResponse,
} from '../api/semi-finished-goods';

interface SemiFinishedGoodsEnvelope {
  data: SemiFinishedGoodListResponse;
  status: number;
}

/** Default query for picker consumers. */
const PICKER_QUERY: MastersListQuery = { page: 0, pageSize: 100, sort: 'name' };

export function useSemiFinishedGoods(query: MastersListQuery = PICKER_QUERY) {
  const result = useQuery({ ...semiFinishedGoodsQueryOptions(query), placeholderData: (prev) => prev });
  const envelope = result.data as SemiFinishedGoodsEnvelope | undefined;
  const semiFinishedGoods: SemiFinishedGoodRow[] = envelope?.data.results ?? [];

  return {
    semiFinishedGoods,
    count: envelope?.data.count ?? 0,
    isLoading: result.isPending,
    refetch: result.refetch,
  };
}
