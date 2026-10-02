import { getAdminListProductsQueryOptions } from '../../../sdk/inventory';
import type { ProductListItem, ProductListResponse } from '../../../sdk/schemas';
import type { MastersListQuery } from './list-query';
import { toListParams } from './list-query';
import { downloadFile } from '../../../api/download';

export type ProductRow = ProductListItem;
export type { ProductListResponse };

export function productsQueryOptions(query: MastersListQuery) {
  return getAdminListProductsQueryOptions(toListParams(query));
}

/** Download the product-import template (columns mirror the Add-product form). */
export async function downloadProductSampleCsv(): Promise<void> {
  await downloadFile(
    '/api/v1/admin/masters/products/sample-csv',
    undefined,
    'product-import-sample.csv',
  );
}
