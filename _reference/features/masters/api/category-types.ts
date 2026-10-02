import { getAdminListCategoryTypesQueryOptions } from '../../../sdk/inventory';
import type { CategoryTypeListItem, CategoryTypeListResponse } from '../../../sdk/schemas';
import type { MastersListQuery } from './list-query';
import { toListParams } from './list-query';

export type CategoryTypeRow = CategoryTypeListItem;
export type { CategoryTypeListResponse };

export function categoryTypesQueryOptions(query: MastersListQuery) {
  return getAdminListCategoryTypesQueryOptions(toListParams(query));
}
