import { useMemo } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { CheckCircle2, Eye, Factory, Pencil, Trash2 } from 'lucide-react';
import { CommonTable, type ColumnDef } from '../../../common/common-table';
import { ActionMenu, type ActionMenuItem } from '../../../common/action-menu';
import { cn } from '../../../lib/cn';
import { formatDate, formatQty } from '../../../utils/format';
import { pipelineStageName, type BomOrderRow } from '../api/bom-orders';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-secondary text-secondary-foreground',
  CONFIRMED: 'bg-emerald-100 text-emerald-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-700',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        STATUS_STYLES[status] ?? 'bg-secondary text-secondary-foreground',
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

export interface BomOrdersTableProps {
  orders: BomOrderRow[];
  loading: boolean;
  rowCount: number;
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  onPaginationChange: (state: { pageIndex: number; pageSize: number }) => void;
  onSortingChange: (sorting: SortingState) => void;
  onView: (order: BomOrderRow) => void;
  onEdit: (order: BomOrderRow) => void;
  onDelete: (order: BomOrderRow) => void;
  onCreateOrder: (order: BomOrderRow) => void;
  onSendToProduction: (order: BomOrderRow) => void;
}

export function BomOrdersTable({
  orders,
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
  onCreateOrder,
  onSendToProduction,
}: BomOrdersTableProps) {
  const columns = useMemo<ColumnDef<BomOrderRow, unknown>[]>(
    () => [
      {
        accessorKey: 'bom_name',
        header: 'Product Name',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.bom_name ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'batch_no',
        header: 'Batch No',
        cell: ({ row }) => (
          <span title={row.original.batch_no} className="font-mono text-xs text-foreground">{row.original.batch_no}</span>
        ),
      },
      {
        accessorKey: 'mfg_date',
        header: 'Mfg Date',
        meta: { align: 'center' },
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-foreground">{formatDate(row.original.mfg_date)}</span>
        ),
      },
      {
        accessorKey: 'batch_size',
        header: 'Batch Size',
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ row }) => (
          <span className="text-foreground">
            {row.original.batch_size != null ? formatQty(row.original.batch_size) : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        meta: { align: 'center' },
        cell: ({ row }) => (
          <div className="flex flex-col items-center gap-1">
            <StatusBadge status={row.original.status} />
            {row.original.pipeline?.exists ? (
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                In {pipelineStageName(row.original.pipeline.stage)}
              </span>
            ) : row.original.pipeline?.status === 'CANCELLED' ? (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                Cancelled in {pipelineStageName(row.original.pipeline.stage)}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        meta: { align: 'center' },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ row }) => {
          const inPipeline = row.original.pipeline?.exists === true;
          const status = row.original.status;
          // A completed order, or one that is in progress while in production,
          // can no longer be deleted — hide the Delete action in those cases.
          const canDelete = status !== 'COMPLETED' && !(status === 'IN_PROGRESS' && inPipeline);
          const items: ActionMenuItem[] = [
            {
              label: 'View',
              icon: <Eye className="size-4" />,
              onClick: () => onView(row.original),
            },
          ];
          // Edit while the order is a DRAFT (unreserved) or CONFIRMED (reserved —
          // batch-size edits re-reserve). Once it's in the production pipeline
          // (IN_PROGRESS) — or completed/cancelled — the order is locked.
          if (status === 'DRAFT' || status === 'CONFIRMED') {
            items.push({
              label: 'Edit',
              icon: <Pencil className="size-4" />,
              onClick: () => onEdit(row.original),
            });
          }
          // A DRAFT holds no raw material — "Create Order" confirms it (reserving
          // stock). Only a CONFIRMED order can be sent to production.
          if (status === 'DRAFT') {
            items.push({
              label: 'Create Order',
              icon: <CheckCircle2 className="size-4" />,
              onClick: () => onCreateOrder(row.original),
            });
          }
          if (!inPipeline && status === 'CONFIRMED') {
            items.push({
              label: 'Send to Production',
              icon: <Factory className="size-4" />,
              onClick: () => onSendToProduction(row.original),
            });
          }
          if (canDelete) {
            items.push({
              label: 'Delete',
              icon: <Trash2 className="size-4" />,
              onClick: () => onDelete(row.original),
              color: 'text-destructive',
            });
          }
          return <ActionMenu ariaLabel={`Actions for order ${row.original.batch_no}`} items={items} />;
        },
      },
    ],
    [onView, onEdit, onDelete, onCreateOrder, onSendToProduction],
  );

  return (
    <CommonTable<BomOrderRow>
      columns={columns}
      data={orders}
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
      getRowId={(row) => String(row.uuid)}
      onRowClick={onView}
      emptyState={
        <div className="py-12 text-center text-sm text-muted-foreground">
          No BOM orders yet. Click "Create BOM Order" to get started.
        </div>
      }
    />
  );
}
