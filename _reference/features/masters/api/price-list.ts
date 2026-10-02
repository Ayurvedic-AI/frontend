/** Price List master API surface (feature 070). */
import { getAdminListPriceListQueryOptions } from '../../../sdk/inventory';
import type { AdminListPriceListParams, PriceListItem, PriceListResponse } from '../../../sdk/schemas';
import { downloadFile } from '../../../api/download';

export type PriceListRow = PriceListItem;
export type { PriceListResponse };

export function priceListQueryOptions(params: AdminListPriceListParams) {
  return getAdminListPriceListQueryOptions(params);
}

/** Download the import template (legacy pivoted sheet layout). */
export async function downloadPriceListSampleCsv(): Promise<void> {
  await downloadFile(
    '/api/v1/admin/masters/price-list/sample-csv',
    undefined,
    'price-list-import-sample.csv',
  );
}
