import { useQuery } from '@tanstack/react-query';
import type { MastersListQuery } from '../api/list-query';
import {
  categoryTypesQueryOptions,
  type CategoryTypeRow,
  type CategoryTypeListResponse,
} from '../api/category-types';

interface CategoryTypesEnvelope {
  data: CategoryTypeListResponse;
  status: number;
}

export function useCategoryTypes(query: MastersListQuery) {
  const result = useQuery({ ...categoryTypesQueryOptions(query), placeholderData: (prev) => prev });
  const envelope = result.data as CategoryTypesEnvelope | undefined;
  const categoryTypes: CategoryTypeRow[] = envelope?.data.results ?? [];

  return {
    categoryTypes,
    count: envelope?.data.count ?? 0,
    isLoading: result.isPending,
    refetch: result.refetch,
  };
}
