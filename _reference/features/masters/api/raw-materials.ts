import { getAdminListRawMaterialsQueryOptions } from '../../../sdk/inventory';
import type { RawMaterialListItem, RawMaterialListResponse } from '../../../sdk/schemas';
import type { MastersListQuery } from './list-query';
import { toListParams } from './list-query';

export type RawMaterialRow = RawMaterialListItem;
export type { RawMaterialListResponse };

export function rawMaterialsQueryOptions(query: MastersListQuery) {
  return getAdminListRawMaterialsQueryOptions(toListParams(query));
}
