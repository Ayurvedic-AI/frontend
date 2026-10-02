import { getAdminListStoreTypesQueryOptions } from '../../../sdk/inventory';
import type { StoreTypeListItem, StoreTypeListResponse } from '../../../sdk/schemas';
import type { MastersListQuery } from './list-query';
import { toListParams } from './list-query';

export type StoreTypeRow = StoreTypeListItem;
export type { StoreTypeListResponse };

export function storeTypesQueryOptions(query: MastersListQuery) {
  return getAdminListStoreTypesQueryOptions(toListParams(query));
}
