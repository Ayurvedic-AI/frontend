import { useQuery } from '@tanstack/react-query';
import type { MastersListQuery } from '../api/list-query';
import { vendorsQueryOptions, type VendorRow, type VendorListResponse } from '../api/vendors';

interface VendorsEnvelope {
  data: VendorListResponse;
  status: number;
}

export function useVendors(query: MastersListQuery) {
  const result = useQuery({ ...vendorsQueryOptions(query), placeholderData: (prev) => prev });
  const envelope = result.data as VendorsEnvelope | undefined;
  const vendors: VendorRow[] = envelope?.data.results ?? [];

  return {
    vendors,
    count: envelope?.data.count ?? 0,
    isLoading: result.isPending,
    refetch: result.refetch,
  };
}
