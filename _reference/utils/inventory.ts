import type {
  MovementListItemDirection,
  MovementListItemKind,
  StockBalanceItemItemType,
} from '../sdk/schemas';

export const LOW_STOCK_THRESHOLD = 5;

export type StockStatus = 'out' | 'low' | 'ok';

const TYPE_LABEL: Record<string, string> = {
  product: 'Product',
  raw_material: 'Raw material',
};

const KIND_LABEL: Record<string, string> = {
  grn_receipt: 'GRN receipt',
  dispatch: 'Dispatch',
  transfer: 'Transfer',
  adjustment: 'Adjustment',
  return: 'Return',
  hold: 'Hold',
  release: 'Release',
  processing_consume: 'Processing consume',
  processing_output: 'Processing output',
};

export function inventoryTypeLabel(type: StockBalanceItemItemType | string): string {
  return TYPE_LABEL[type] ?? type;
}

export function movementKindLabel(kind: MovementListItemKind | string): string {
  return KIND_LABEL[kind] ?? kind;
}

export function movementDirectionLabel(direction: MovementListItemDirection | string): string {
  return direction === 'in' ? 'In' : 'Out';
}

export function stockStatus(quantity: number): StockStatus {
  if (quantity <= 0) return 'out';
  if (quantity <= LOW_STOCK_THRESHOLD) return 'low';
  return 'ok';
}

export function stockStatusLabel(status: StockStatus): string {
  if (status === 'out') return 'Out';
  if (status === 'low') return 'Low';
  return 'Healthy';
}

export function formatInventoryQuantity(
  quantity: number | null | undefined,
  unit?: string | null,
): string {
  if (quantity == null) return '-';
  const value = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  return unit ? `${value} ${unit}` : value;
}

export function formatSignedInventoryQuantity(
  direction: MovementListItemDirection | string,
  quantity: number,
  unit?: string | null,
): string {
  const sign = direction === 'out' ? '-' : '+';
  return `${sign}${formatInventoryQuantity(quantity, unit)}`;
}
