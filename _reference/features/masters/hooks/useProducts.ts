import { useQuery } from '@tanstack/react-query';
import type { MastersListQuery } from '../api/list-query';
import { productsQueryOptions, type ProductRow, type ProductListResponse } from '../api/products';

interface ProductsEnvelope {
  data: ProductListResponse;
  status: number;
}

/** Default query for picker consumers (e.g. BOM dialogs). */
const PICKER_QUERY: MastersListQuery = { page: 0, pageSize: 100, sort: 'name' };

export function useProducts(query: MastersListQuery = PICKER_QUERY) {
  const result = useQuery({ ...productsQueryOptions(query), placeholderData: (prev) => prev });
  const envelope = result.data as ProductsEnvelope | undefined;
  const products: ProductRow[] = envelope?.data.results ?? [];

  return {
    products,
    count: envelope?.data.count ?? 0,
    isLoading: result.isPending,
    refetch: result.refetch,
  };
}
