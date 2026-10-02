import { getAdminListSfgCategoriesQueryOptions } from '../../../sdk/inventory';
import type { SfgCategoryListItem, SfgCategoryListResponse } from '../../../sdk/schemas';
import type { MastersListQuery } from './list-query';
import { toListParams } from './list-query';

export type SfgCategoryRow = SfgCategoryListItem;
export type { SfgCategoryListResponse };

export function sfgCategoriesQueryOptions(query: MastersListQuery) {
  return getAdminListSfgCategoriesQueryOptions(toListParams(query));
}
