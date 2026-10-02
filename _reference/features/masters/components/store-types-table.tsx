import { useMemo } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { Pencil, Trash2 } from 'lucide-react';
import { formatDate } from '../../../utils/format';
import { CommonTable, type ColumnDef } from '../../../common/common-table';
import { ActionMenu } from '../../../common/action-menu';
import type { StoreTypeRow } from '../api/store-types';

export interface StoreTypesTableProps {
  storeTypes: StoreTypeRow[];
  loading: boolean;
  rowCount: number;
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  onPaginationChange: (state: { pageIndex: number; pageSize: number }) => void;
  onSortingChange: (sorting: SortingState) => void;
  onEdit: (type: StoreTypeRow) => void;
  onDelete: (type: StoreTypeRow) => void;
}

export function StoreTypesTable({
  storeTypes,
  loading,
  rowCount,
  pageIndex,
  pageSize,
  sorting,
  onPaginationChange,
  onSortingChange,
  onEdit,
  onDelete,
}: StoreTypesTableProps) {
  const columns = useMemo<ColumnDef<StoreTypeRow, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
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
    [onEdit, onDelete],
  );

  return (
    <CommonTable<StoreTypeRow>
      columns={columns}
      data={storeTypes}
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
      emptyState={
        <div className="py-12 text-center text-sm text-muted-foreground">
          No store types yet. Click “Add type” to create the first one.
        </div>
      }
    />
  );
}
