import { getAdminListProductCategoriesQueryOptions } from '../../../sdk/inventory';
import type { ProductCategoryListItem, ProductCategoryListResponse } from '../../../sdk/schemas';
import type { MastersListQuery } from './list-query';
import { toListParams } from './list-query';

export type ProductCategoryRow = ProductCategoryListItem;
export type { ProductCategoryListResponse };

export function productCategoriesQueryOptions(query: MastersListQuery) {
  return getAdminListProductCategoriesQueryOptions(toListParams(query));
}
