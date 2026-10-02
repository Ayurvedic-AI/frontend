import { getAdminListRmCategoriesQueryOptions } from '../../../sdk/inventory';
import type { RmCategoryListItem, RmCategoryListResponse } from '../../../sdk/schemas';
import type { MastersListQuery } from './list-query';
import { toListParams } from './list-query';

export type RmCategoryRow = RmCategoryListItem;
export type { RmCategoryListResponse };

export function rmCategoriesQueryOptions(query: MastersListQuery) {
  return getAdminListRmCategoriesQueryOptions(toListParams(query));
}
