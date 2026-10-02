import { getAdminListBomsQueryOptions } from '../../../sdk/inventory';
import type { BomListItem, BomListResponse, BomLineItem } from '../../../sdk/schemas';
import type { MastersListQuery } from './list-query';
import { toListParams } from './list-query';
import { downloadFile } from '../../../api/download';

export type BomRow = BomListItem;
export type { BomListResponse, BomLineItem };

export function bomsQueryOptions(query: MastersListQuery, extra?: { kind?: 'product' | 'sfg' }) {
  return getAdminListBomsQueryOptions({
    ...toListParams(query),
    ...(extra?.kind ? { kind: extra.kind } : {}),
  });
}

/** Download a BOM template as a dispensing-sheet CSV via the shared download utility. */
export async function exportBomCsv(bomId: number, filename: string): Promise<void> {
  await downloadFile(`/api/v1/admin/masters/boms/${bomId}/export-csv`, undefined, filename);
}
