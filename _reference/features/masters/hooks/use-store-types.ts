import { useQuery } from '@tanstack/react-query';
import type { MastersListQuery } from '../api/list-query';
import {
  storeTypesQueryOptions,
  type StoreTypeRow,
  type StoreTypeListResponse,
} from '../api/store-types';

interface StoreTypesEnvelope {
  data: StoreTypeListResponse;
  status: number;
}

export function useStoreTypes(query: MastersListQuery) {
  const result = useQuery({ ...storeTypesQueryOptions(query), placeholderData: (prev) => prev });
  const envelope = result.data as StoreTypesEnvelope | undefined;
  const storeTypes: StoreTypeRow[] = envelope?.data.results ?? [];

  return {
    storeTypes,
    count: envelope?.data.count ?? 0,
    isLoading: result.isPending,
    refetch: result.refetch,
  };
}
