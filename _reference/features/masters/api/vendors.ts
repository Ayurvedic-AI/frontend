import { getAdminListVendorsQueryOptions } from '../../../sdk/inventory';
import type { VendorListItem, VendorListResponse } from '../../../sdk/schemas';
import type { MastersListQuery } from './list-query';
import { toListParams } from './list-query';

export type VendorRow = VendorListItem;
export type { VendorListResponse };

export function vendorsQueryOptions(query: MastersListQuery) {
  return getAdminListVendorsQueryOptions(toListParams(query));
}
