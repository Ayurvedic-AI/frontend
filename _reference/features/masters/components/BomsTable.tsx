import { useMemo } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { Copy, Download, Eye, Pencil, Power, Trash2 } from 'lucide-react';
import { CommonTable, type ColumnDef } from '../../../common/common-table';
import { ActionMenu } from '../../../common/action-menu';
import type { BomRow } from '../api/boms';
import { useProducts } from '../hooks/useProducts';
import { ActivePill } from './ActivePill';

/** Strip a trailing " (vN)" version tag from a BOM name (mirrors BomsPage). */
const stripVersionTag = (name: string) => name.replace(/\s*\(v\d+\)\s*$/i, '').trim();
/** Parse the version number from a name's trailing " (vN)" (1 when untagged). */
const parseVersionTag = (name: string) => {
  const m = name.match(/\(v(\d+)\)\s*$/i);
  return m ? Number(m[1]) : 1;
};

export interface BomsTableProps {
  boms: BomRow[];
  loading: boolean;
  rowCount: number;
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  onPaginationChange: (state: { pageIndex: number; pageSize: number }) => void;
  onSortingChange: (sorting: SortingState) => void;
  onRowClick: (bom: BomRow) => void;
  onEdit: (bom: BomRow) => void;
  onDuplicate: (bom: BomRow) => void;
  onToggleStatus: (bom: BomRow) => void;
  onDelete: (bom: BomRow) => void;
  onExportCsv: (bom: BomRow) => void;
}

export function BomsTable({
  boms,
  loading,
  rowCount,
  pageIndex,
  pageSize,
  sorting,
  onPaginationChange,
  onSortingChange,
  onRowClick,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
  onExportCsv,
}: BomsTableProps) {
  const { products } = useProducts();
  const categoryByProductId = useMemo(
    () => new Map(products.map((p) => [p.id, p.category])),
    [products],
  );

  const columns = useMemo<ColumnDef<BomRow, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Product',
        cell: ({ row }) => {
          const category = row.original.product_id != null ? categoryByProductId.get(row.original.product_id) : undefined;
          const version = parseVersionTag(row.original.name);
          return (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRowClick(row.original);
                }}
                className="cursor-pointer text-left font-medium text-primary hover:underline focus-visible:outline-none focus-visible:underline"
              >
                {stripVersionTag(row.original.name)}{category ? ` - ${category}` : ''}
              </button>
              {version > 1 && (
                <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  v{version}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'semi_finished_good_id',
        header: 'Type',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.semi_finished_good_id != null ? (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              Semi-finished good
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              Finished good
            </span>
          ),
      },
      // {
      //   accessorKey: 'output_qty',
      //   header: 'Batch size',
      //   enableSorting: false,
      //   meta: { align: 'center' },
      //   cell: ({ row }) => (
      //     <span className="text-sm text-muted-foreground">{row.original.output_qty ?? '—'}</span>
      //   ),
      // },
      {
        accessorKey: 'line_count',
        header: 'Lines',
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {row.original.line_count} {row.original.line_count === 1 ? 'item' : 'items'}
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
              { label: 'View', icon: <Eye className="size-4" />, onClick: () => onRowClick(row.original) },
              { label: 'Edit', icon: <Pencil className="size-4" />, onClick: () => onEdit(row.original) },
              { label: 'Create new version', icon: <Copy className="size-4" />, onClick: () => onDuplicate(row.original) },
              { label: 'Export CSV', icon: <Download className="size-4" />, onClick: () => onExportCsv(row.original) },
              {
                label: row.original.is_active ? 'Deactivate' : 'Activate',
                icon: <Power className="size-4" />,
                onClick: () => onToggleStatus(row.original),
                color: row.original.is_active ? 'text-destructive' : undefined,
              },
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
    [onRowClick, onEdit, onDuplicate, onToggleStatus, onDelete, onExportCsv, categoryByProductId],
  );

  return (
    <CommonTable<BomRow>
      columns={columns}
      data={boms}
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
      onRowClick={onRowClick}
      emptyState={
        <div className="py-12 text-center text-sm text-muted-foreground">
          No BOM templates yet. Click "Add Template" to create the first one.
        </div>
      }
    />
  );
}
