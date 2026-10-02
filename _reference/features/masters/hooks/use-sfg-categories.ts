import { useQuery } from '@tanstack/react-query';
import type { MastersListQuery } from '../api/list-query';
import {
  sfgCategoriesQueryOptions,
  type SfgCategoryRow,
  type SfgCategoryListResponse,
} from '../api/sfg-categories';

interface SfgCategoriesEnvelope {
  data: SfgCategoryListResponse;
  status: number;
}

export function useSfgCategories(query: MastersListQuery) {
  const result = useQuery({ ...sfgCategoriesQueryOptions(query), placeholderData: (prev) => prev });
  const envelope = result.data as SfgCategoriesEnvelope | undefined;
  const categories: SfgCategoryRow[] = envelope?.data.results ?? [];

  return {
    categories,
    count: envelope?.data.count ?? 0,
    isLoading: result.isPending,
    refetch: result.refetch,
  };
}
