import { useQuery } from '@tanstack/react-query';
import type { MastersListQuery } from '../api/list-query';
import { doctorsQueryOptions, type DoctorRow, type DoctorListResponse } from '../api/doctors';

interface DoctorsEnvelope {
  data: DoctorListResponse;
  status: number;
}

export function useDoctors(query: MastersListQuery) {
  const result = useQuery({ ...doctorsQueryOptions(query), placeholderData: (prev) => prev });
  const envelope = result.data as DoctorsEnvelope | undefined;
  const doctors: DoctorRow[] = envelope?.data.results ?? [];

  return {
    doctors,
    count: envelope?.data.count ?? 0,
    isLoading: result.isPending,
    refetch: result.refetch,
  };
}

/** Doctor list for picker dropdowns (alias / pricing forms). */
export function useDoctorOptions() {
  return useDoctors({ page: 0, pageSize: 100, sort: 'name' });
}
