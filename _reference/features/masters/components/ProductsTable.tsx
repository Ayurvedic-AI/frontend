import { useMemo } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { Eye, Pencil, Power } from 'lucide-react';
import { CommonTable, type ColumnDef } from '../../../common/common-table';
import { ActionMenu } from '../../../common/action-menu';
import type { ProductRow } from '../api/products';
import { ActivePill } from './ActivePill';

export interface ProductsTableProps {
  products: ProductRow[];
  loading: boolean;
  /** Server-side list state (feature 027). */
  rowCount: number;
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  onPaginationChange: (state: { pageIndex: number; pageSize: number }) => void;
  onSortingChange: (sorting: SortingState) => void;
  onView: (product: ProductRow) => void;
  onEdit: (product: ProductRow) => void;
  onToggleStatus: (product: ProductRow) => void;
}

export function ProductsTable({
  products,
  loading,
  rowCount,
  pageIndex,
  pageSize,
  sorting,
  onPaginationChange,
  onSortingChange,
  onView,
  onEdit,
  onToggleStatus,
}: ProductsTableProps) {
  // Canonical column order (feature 048): SKU · Name · Category · HSN ·
  // Unit · Shelf life · Status · Action — matching the add/edit drawer.
  const columns = useMemo<ColumnDef<ProductRow, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'SKU',
        cell: ({ row }) => <span title={row.original.code} className="font-mono text-xs text-foreground">{row.original.code}</span>,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span title={row.original.name} className="font-medium text-foreground">{row.original.name}</span>,
      },
      {
        accessorKey: 'category',
        header: 'Category',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.category ? (
            <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
              {row.original.category}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'hsn',
        header: 'HSN',
        enableSorting: false,
        cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.hsn ?? '—'}</span>,
      },
      {
        accessorKey: 'pack_size',
        header: 'Unit',
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ row }) => <span className="text-foreground">{row.original.pack_size ?? '—'}</span>,
      },
      {
        accessorKey: 'shelf_life_months',
        header: 'Shelf life',
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ row }) => (
          <span className="tabular-nums text-foreground">
            {row.original.shelf_life_months != null ? `${row.original.shelf_life_months} mo` : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'reorder_level',
        header: 'Re-order level',
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ row }) => (
          <span className="tabular-nums text-foreground">
            {row.original.reorder_level != null ? row.original.reorder_level : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        meta: { align: 'center' },
        cell: ({ row }) => <ActivePill active={row.original.is_active} />,
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ row }) => (
          <ActionMenu
            ariaLabel={`Actions for ${row.original.name}`}
            items={[
              { label: 'View', icon: <Eye className="size-4" />, onClick: () => onView(row.original) },
              { label: 'Edit', icon: <Pencil className="size-4" />, onClick: () => onEdit(row.original) },
              {
                label: row.original.is_active ? 'Deactivate' : 'Activate',
                icon: <Power className="size-4" />,
                onClick: () => onToggleStatus(row.original),
                color: row.original.is_active ? 'text-destructive' : undefined,
              },
            ]}
          />
        ),
      },
    ],
    [onView, onEdit, onToggleStatus],
  );

  return (
    <CommonTable<ProductRow>
      columns={columns}
      data={products}
      loading={loading}
      enableSorting
      manualSorting
      sorting={sorting}
      onSortingChange={onSortingChange}
      enablePagination
      manualPagination
      rowCount={rowCount}
      pageIndex={pageIndex}
      pageSize={pageSize}
      onPaginationChange={onPaginationChange}
      onRowClick={onView}
      getRowId={(row) => String(row.id)}
      emptyState={
        <div className="py-12 text-center text-sm text-muted-foreground">
          No products yet. Click “Add product” to create the first one.
        </div>
      }
    />
  );
}
