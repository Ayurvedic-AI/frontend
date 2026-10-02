import { getAdminListBomOrdersQueryOptions } from '../../../sdk/inventory';
import type { BomOrderOut } from '../../../sdk/schemas';
import type { MastersListQuery } from './list-query';
import { toListParams } from './list-query';

export type BomOrderRow = BomOrderOut;

/** Human-friendly pipeline stage name for inline display.
 *  PRODUCTION is surfaced as "Manufacturing" (it is the Manufacturing stage). */
export function pipelineStageName(stage?: string | null): string {
  switch (stage) {
    case 'PRODUCTION':
      return 'Manufacturing';
    case 'TESTING':
      return 'Testing';
    case 'PACKING':
      return 'Packing';
    case 'FINISHED_GOODS':
      return 'Finished Goods';
    default:
      return stage ? stage.replace(/_/g, ' ') : '';
  }
}

export function bomOrdersQueryOptions(query: MastersListQuery & { status?: string }) {
  const params = toListParams(query);
  return getAdminListBomOrdersQueryOptions({
    ...params,
    ...(query.status ? { status: query.status } : {}),
  });
}
