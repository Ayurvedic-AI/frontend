/** List state for the Price List master (feature 070): server search +
 * type/category filters + BACKEND offset paging (limit/offset on
 * adminListPriceList; the table renders one server page at a time). */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { priceListQueryOptions, type PriceListResponse, type PriceListRow } from '../api/price-list';

const DEFAULT_PAGE_SIZE = 10;

interface Envelope {
  data: PriceListResponse;
  status: number;
}

export function usePriceList() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const result = useQuery({
    ...priceListQueryOptions({
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(category ? { category } : {}),
      ...(kind ? { kind: kind as 'product' | 'raw_material' } : {}),
      limit: pageSize,
      offset: page * pageSize,
    }),
    placeholderData: (prev) => prev,
  });
  const envelope = result.data as Envelope | undefined;
  const items: PriceListRow[] = envelope?.data.items ?? [];
  const total = envelope?.data.total ?? 0;

  return {
    items,
    total,
    isLoading: result.isPending,
    refetch: result.refetch,
    search,
    setSearch: (v: string) => {
      setSearch(v);
      setPage(0);
    },
    category,
    setCategory: (v: string) => {
      setCategory(v);
      setPage(0);
    },
    kind,
    setKind: (v: string) => {
      setKind(v);
      setPage(0);
    },
    page,
    setPage,
    pageSize,
    setPageSize: (size: number) => {
      setPageSize(size);
      setPage(0);
    },
  };
}
