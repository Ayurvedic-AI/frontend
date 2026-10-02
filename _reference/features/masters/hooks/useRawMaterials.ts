import { useQuery } from '@tanstack/react-query';
import type { MastersListQuery } from '../api/list-query';
import {
  rawMaterialsQueryOptions,
  type RawMaterialRow,
  type RawMaterialListResponse,
} from '../api/raw-materials';

interface RawMaterialsEnvelope {
  data: RawMaterialListResponse;
  status: number;
}

/** Default query for picker consumers (e.g. the BOM dialog). */
const PICKER_QUERY: MastersListQuery = { page: 0, pageSize: 100, sort: 'name' };

export function useRawMaterials(query: MastersListQuery = PICKER_QUERY) {
  const result = useQuery({ ...rawMaterialsQueryOptions(query), placeholderData: (prev) => prev });
  const envelope = result.data as RawMaterialsEnvelope | undefined;
  const materials: RawMaterialRow[] = envelope?.data.results ?? [];

  return {
    materials,
    count: envelope?.data.count ?? 0,
    isLoading: result.isPending,
    refetch: result.refetch,
  };
}
