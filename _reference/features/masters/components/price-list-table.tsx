/**
 * Price List table (feature 070): ONE flat CommonTable — Category is a column
 * (filtered from the toolbar's CustomSelect, not section headers). Row click →
 * View; kebab → View / Edit / Delete. Version shows when a product's prices
 * were re-saved.
 */
import { useMemo } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { CommonTable, type ColumnDef } from '../../../common/common-table';
import { ActionMenu } from '../../../common/action-menu';
import { formatDate } from '../../../utils/format';
import type { PriceListRow } from '../api/price-list';

export interface PriceListTableProps {
  items: PriceListRow[];
  loading: boolean;
  onView: (row: PriceListRow) => void;
  onEdit: (row: PriceListRow) => void;
  onDelete: (row: PriceListRow) => void;
  /** Server-side pagination: `items` is one page; totals come from the server. */
  page: number;
  pageSize: number;
  total: number;
  onPaginationChange: (state: { pageIndex: number; pageSize: number }) => void;
}

export function PriceListTable({
  items,
  loading,
  onView,
  onEdit,
  onDelete,
  page,
  pageSize,
  total,
  onPaginationChange,
}: PriceListTableProps) {
  const columns = useMemo<ColumnDef<PriceListRow, unknown>[]>(
    () => [
      {
        accessorKey: 'product_name',
        header: 'Item',
        cell: ({ row }) => (
          <div className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span title={row.original.product_name} className="truncate font-medium text-foreground">
                {row.original.product_name}
              </span>
              <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                v{row.original.version ?? 1}
              </span>
            </span>
            <span className="block text-xs text-muted-foreground">
              <span className="font-mono">{row.original.product_code}</span>
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'item_kind',
        header: 'Type',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.item_kind === 'raw_material' ? (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              Raw material
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              Finished good
            </span>
          ),
      },
      {
        accessorKey: 'product_category',
        header: 'Category',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.product_category ? (
            <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
              {row.original.product_category}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: 'prices',
        header: 'Prices',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-nowrap items-center gap-1.5 overflow-hidden">
            {row.original.entries.slice(0, 3).map((e) => (
              <span
                key={e.id}
                className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
              >
                <span className="font-medium">{e.pack_label}</span>
                <span className="tabular-nums">₹{e.price}</span>
              </span>
            ))}
            {row.original.entries.length > 3 && (
              <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                +{row.original.entries.length - 3} more
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'updated_at',
        header: 'Updated',
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.updated_at)}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ row }) => (
          <ActionMenu
            ariaLabel={`Actions for ${row.original.product_name}`}
            items={[
              { label: 'View', icon: <Eye className="size-4" />, onClick: () => onView(row.original) },
              { label: 'Edit', icon: <Pencil className="size-4" />, onClick: () => onEdit(row.original) },
              {
                label: 'Delete',
                icon: <Trash2 className="size-4" />,
                onClick: () => onDelete(row.original),
                color: 'text-destructive',
              },
            ]}
          />
        ),
      },
    ],
    [onView, onEdit, onDelete],
  );

  return (
    <CommonTable<PriceListRow>
      columns={columns}
      data={items}
      loading={loading}
      onRowClick={onView}
      getRowId={(row) => String(row.id)}
      enablePagination
      manualPagination
      pageIndex={page}
      pageSize={pageSize}
      rowCount={total}
      pageCount={Math.max(1, Math.ceil(total / pageSize))}
      onPaginationChange={onPaginationChange}
      emptyState={
        <div className="py-12 text-center text-sm text-muted-foreground">
          No price lists yet. Click “Add price list” to create the first one, or import the legacy sheet.
        </div>
      }
    />
  );
}
