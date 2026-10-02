import { useQuery } from '@tanstack/react-query';
import type { MastersListQuery } from '../api/list-query';
import {
  productCategoriesQueryOptions,
  type ProductCategoryRow,
  type ProductCategoryListResponse,
} from '../api/product-categories';

interface ProductCategoriesEnvelope {
  data: ProductCategoryListResponse;
  status: number;
}

export function useProductCategories(query: MastersListQuery) {
  const result = useQuery({ ...productCategoriesQueryOptions(query), placeholderData: (prev) => prev });
  const envelope = result.data as ProductCategoriesEnvelope | undefined;
  const categories: ProductCategoryRow[] = envelope?.data.results ?? [];

  return {
    categories,
    count: envelope?.data.count ?? 0,
    isLoading: result.isPending,
    refetch: result.refetch,
  };
}
