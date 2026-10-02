import { getAdminListSemiFinishedGoodsQueryOptions } from '../../../sdk/inventory';
import type { SemiFinishedGoodListItem, SemiFinishedGoodListResponse } from '../../../sdk/schemas';
import type { MastersListQuery } from './list-query';
import { toListParams } from './list-query';

export type SemiFinishedGoodRow = SemiFinishedGoodListItem;
export type { SemiFinishedGoodListResponse };

export function semiFinishedGoodsQueryOptions(query: MastersListQuery) {
  return getAdminListSemiFinishedGoodsQueryOptions(toListParams(query));
}
