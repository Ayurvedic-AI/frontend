import { useQuery } from '@tanstack/react-query';
import type { MastersListQuery } from '../api/list-query';
import {
  rmCategoriesQueryOptions,
  type RmCategoryRow,
  type RmCategoryListResponse,
} from '../api/rm-categories';

interface RmCategoriesEnvelope {
  data: RmCategoryListResponse;
  status: number;
}

export function useRmCategories(query: MastersListQuery) {
  const result = useQuery({ ...rmCategoriesQueryOptions(query), placeholderData: (prev) => prev });
  const envelope = result.data as RmCategoriesEnvelope | undefined;
  const categories: RmCategoryRow[] = envelope?.data.results ?? [];

  return {
    categories,
    count: envelope?.data.count ?? 0,
    isLoading: result.isPending,
    refetch: result.refetch,
  };
}
