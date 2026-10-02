import { useMemo } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '../../../utils/format';
import { CommonTable, type ColumnDef } from '../../../common/common-table';
import { ActionMenu } from '../../../common/action-menu';
import type { SemiFinishedGoodRow } from '../api/semi-finished-goods';

export interface SemiFinishedGoodsTableProps {
  semiFinishedGoods: SemiFinishedGoodRow[];
  loading: boolean;
  /** Server-side list state. */
  rowCount: number;
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  onPaginationChange: (state: { pageIndex: number; pageSize: number }) => void;
  onSortingChange: (sorting: SortingState) => void;
  onView: (sfg: SemiFinishedGoodRow) => void;
  onEdit: (sfg: SemiFinishedGoodRow) => void;
  onDelete: (sfg: SemiFinishedGoodRow) => void;
}

export function SemiFinishedGoodsTable({
  semiFinishedGoods,
  loading,
  rowCount,
  pageIndex,
  pageSize,
  sorting,
  onPaginationChange,
  onSortingChange,
  onView,
  onEdit,
  onDelete,
}: SemiFinishedGoodsTableProps) {
  const columns = useMemo<ColumnDef<SemiFinishedGoodRow, unknown>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => <span title={row.original.code} className="font-mono text-xs text-foreground">{row.original.code}</span>,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span title={row.original.name} className="font-medium text-foreground">{row.original.name}</span>,
      },
      {
        accessorKey: 'sfg_category_name',
        header: 'Category',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.sfg_category_name ? (
            <span title={row.original.sfg_category_name} className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
              {row.original.sfg_category_name}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'unit',
        header: 'Unit of measure',
        enableSorting: false,
        cell: ({ row }) => <span className="text-foreground">{row.original.unit || '—'}</span>,
      },
      {
        accessorKey: 'reorder_level',
        header: 'Re-order level',
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ row }) => (
          <span className="text-foreground">{row.original.reorder_level ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'shelf_life_months',
        header: 'Shelf life',
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ row }) => (
          <span className="text-foreground">
            {row.original.shelf_life_months != null ? `${row.original.shelf_life_months} mo` : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        meta: { align: 'center' },
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDate(row.original.created_at)}</span>
        ),
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
    <CommonTable<SemiFinishedGoodRow>
      columns={columns}
      data={semiFinishedGoods}
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
      getRowId={(row) => String(row.id)}
      onRowClick={onView}
      emptyState={
        <div className="py-12 text-center text-sm text-muted-foreground">
          No semi-finished goods yet. Click “Add semi-finished good” to create the first one.
        </div>
      }
    />
  );
}
