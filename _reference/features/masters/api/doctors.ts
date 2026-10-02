import { getAdminListDoctorsQueryOptions } from '../../../sdk/inventory';
import type { DoctorListItem, DoctorListResponse } from '../../../sdk/schemas';
import type { MastersListQuery } from './list-query';
import { toListParams } from './list-query';

export type DoctorRow = DoctorListItem;
export type { DoctorListResponse };

export function doctorsQueryOptions(query: MastersListQuery) {
  return getAdminListDoctorsQueryOptions(toListParams(query));
}
