import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type RowData,
  type SortingState,
  type Table as TanstackTable,
} from '@tanstack/react-table';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'center' | 'right';
    /** Extra classes on the column's header and body cells (e.g. `hidden md:table-cell`). */
    className?: string;
  }
}
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { Fragment, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Paginator } from '../pagination';
import TableSkeleton from './TableSkeleton';

// Re-export TanStack Table types so legacy consumers' imports keep working.
export type { ColumnDef, Row, TanstackTable as Table };

// Opaque mixes of the translucent thead / row-hover fills, for the sticky actions column.
const SECONDARY_50 = 'bg-[color-mix(in_srgb,var(--color-secondary)_50%,var(--color-background))]';
const SECONDARY_40_HOVER =
  'group-hover:bg-[color-mix(in_srgb,var(--color-secondary)_40%,var(--color-background))]';

function colAlign(align?: 'left' | 'center' | 'right'): string {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return '';
}

export interface CommonTableProps<TRow> {
  columns: ColumnDef<TRow, unknown>[];
  data: TRow[];
  loading?: boolean;
  emptyState?: ReactNode;
  /** Override row id resolution; defaults to React index. */
  getRowId?: (row: TRow, index: number) => string;
  onRowClick?: (row: TRow) => void;
  /** Optional per-row className (e.g. an aging-warning highlight). Merged onto the `<tr>`. */
  getRowClassName?: (row: TRow) => string;
  /** Render a full-width panel row under a given row; return null/false to keep it collapsed. Caller owns expansion state. */
  renderExpanded?: (row: TRow) => ReactNode;

  // Sorting
  enableSorting?: boolean;
  defaultSorting?: SortingState;
  /** Controlled sorting state (pair with `manualSorting` for server-side sort). */
  sorting?: SortingState;
  /** Fires when the sort changes. */
  onSortingChange?: (sorting: SortingState) => void;
  /** Server-side sort: do NOT sort `data` locally. */
  manualSorting?: boolean;

  // Pagination
  enablePagination?: boolean;
  pageSize?: number;
  pageIndex?: number;
  onPaginationChange?: (state: { pageIndex: number; pageSize: number }) => void;
  /** Server-side pagination: `data` is one page; totals come from the server. */
  manualPagination?: boolean;
  /** Total page count (server-side). Falls back to ceil(rowCount / pageSize). */
  pageCount?: number;
  /** Total record count across all pages (server-side). */
  rowCount?: number;

  // Layout
  density?: 'comfortable' | 'compact';
  stickyHeader?: boolean;
  /** Constrain the table body to a height; only the rows scroll (not the page). */
  maxHeight?: string | number;
  className?: string;
  tableClassName?: string;
}

export function CommonTable<TRow>({
  columns,
  data,
  loading,
  emptyState,
  getRowId,
  onRowClick,
  getRowClassName,
  renderExpanded,
  enableSorting,
  defaultSorting,
  sorting: sortingProp,
  onSortingChange,
  manualSorting,
  enablePagination,
  pageSize: pageSizeProp,
  pageIndex: pageIndexProp,
  onPaginationChange,
  manualPagination,
  pageCount,
  rowCount,
  density = 'comfortable',
  stickyHeader,
  maxHeight,
  className,
  tableClassName,
}: CommonTableProps<TRow>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>(defaultSorting ?? []);
  const sorting = sortingProp ?? internalSorting;
  const [internalPagination, setInternalPagination] = useState({
    pageIndex: pageIndexProp ?? 0,
    pageSize: pageSizeProp ?? 10,
  });

  const pagination = pageIndexProp !== undefined ? { pageIndex: pageIndexProp, pageSize: pageSizeProp ?? 10 } : internalPagination;
  // Track the latest pagination synchronously so that two updates fired in the
  // same tick (the Paginator's setPageSize + setPageIndex(0)) compose instead of
  // the second one reading a stale closure and reverting the first.
  const paginationRef = useRef(pagination);
  paginationRef.current = pagination;

  const table = useReactTable<TRow>({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      setInternalSorting(next);
      onSortingChange?.(next);
    },
    onPaginationChange: (updater) => {
      const base = paginationRef.current;
      const next = typeof updater === 'function' ? updater(base) : updater;
      paginationRef.current = next;
      setInternalPagination(next);
      onPaginationChange?.(next);
    },
    getRowId: getRowId ? (row, idx) => getRowId(row, idx) : undefined,
    enableSorting: Boolean(enableSorting),
    manualSorting: Boolean(manualSorting),
    manualPagination: Boolean(manualPagination),
    pageCount: manualPagination
      ? pageCount ?? Math.max(1, Math.ceil((rowCount ?? data.length) / (pagination.pageSize || 1)))
      : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting && !manualSorting ? getSortedRowModel() : undefined,
    // Server-side pages are already sliced upstream; only slice client-side.
    getPaginationRowModel: enablePagination && !manualPagination ? getPaginationRowModel() : undefined,
  });

  const cellPadding = density === 'compact' ? 'px-3 py-2' : 'px-4 py-3';

  if (loading) {
    const headers = columns.map((c, i) => ({
      id: typeof c.id === 'string' ? c.id : `col-${i}`,
      label: typeof (c as { header?: unknown }).header === 'string' ? String((c as { header: string }).header) : '',
      width: 'auto',
    }));
    return (
      <div className={cn('overflow-hidden rounded-lg border border-border bg-background', className)}>
        <TableSkeleton headers={headers} rowCount={Math.max(3, pagination.pageSize)} />
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-background', className)} data-slot="root">
      <div className="overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
        <table className={cn('w-full text-left text-sm', tableClassName)} data-slot="table">
          <thead className={cn(stickyHeader ? 'sticky top-0 z-10 bg-secondary' : 'bg-secondary/50')}>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const sort = h.column.getIsSorted();
                  const canSort = enableSorting && h.column.getCanSort();
                  return (
                    <th
                      key={h.id}
                      style={{ width: h.getSize() ? `${h.getSize()}px` : undefined }}
                      className={cn(
                        'border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground',
                        cellPadding,
                        canSort && 'cursor-pointer select-none',
                        colAlign(h.column.columnDef.meta?.align),
                        h.column.columnDef.meta?.className,
                        // Pin the actions column to the right so it's always reachable. Opaque
                        // equivalent of the thead fill so it neither shows through nor reads as a block.
                        h.column.id === 'actions' &&
                          cn('sticky right-0 z-20', stickyHeader ? 'bg-secondary' : SECONDARY_50),
                      )}
                      onClick={canSort ? h.column.getToggleSortingHandler() : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                        {canSort && (
                          sort === 'asc' ? (
                            <ChevronUp aria-hidden className="size-3" />
                          ) : sort === 'desc' ? (
                            <ChevronDown aria-hidden className="size-3" />
                          ) : (
                            <ChevronsUpDown aria-hidden className="size-3 opacity-40" />
                          )
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                  {emptyState ?? 'No data available'}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const rowTint = getRowClassName?.(row.original) ?? '';
                const expanded = renderExpanded?.(row.original);
                return (
                  <Fragment key={row.id}>
                  <tr
                    onClick={
                      onRowClick
                        ? (e) => {
                            // Ignore clicks that originate from an interactive control
                            // inside the row (action menus, buttons, links, inputs) so
                            // performing an action never also opens the row dialog (#30).
                            if (
                              (e.target as HTMLElement).closest(
                                'button, a, input, select, textarea, [role="menuitem"], [data-no-row-click]',
                              )
                            ) {
                              return;
                            }
                            onRowClick(row.original);
                          }
                        : undefined
                    }
                    className={cn(
                      'group border-b border-border/60 transition-colors last:border-b-0 hover:bg-secondary/40',
                      onRowClick && 'cursor-pointer',
                      rowTint,
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          'text-foreground',
                          cellPadding,
                          colAlign(cell.column.columnDef.meta?.align),
                          cell.column.columnDef.meta?.className,
                          // Pinned actions column: stays right, bg matches the row's own tint
                          // (falls back to opaque bg-background). Hover uses the opaque equivalent
                          // of the row's hover fill so scrolled cells never bleed through.
                          cell.column.id === 'actions' &&
                            cn(
                              'sticky right-0 shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.08)]',
                              rowTint || cn('bg-background', SECONDARY_40_HOVER),
                            ),
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {expanded != null && expanded !== false && (
                    <tr className="border-b border-border/60 bg-secondary/20 last:border-b-0">
                      <td colSpan={columns.length} className="px-4 py-3">
                        {expanded}
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {enablePagination && (manualPagination ? (rowCount ?? 0) > 0 : data.length > 0) && (
        <div className="border-t border-border px-2">
          <Paginator
            page={pagination.pageIndex}
            totalPages={table.getPageCount()}
            totalRecord={manualPagination ? rowCount ?? data.length : data.length}
            defaultSize={pagination.pageSize}
            onPageChange={(_e, page) => {
              if (manualPagination) {
                // Bypass react-table's pageCount clamp + stale-closure issues:
                // emit the change straight to the parent, composing via the ref.
                const next = { pageIndex: page, pageSize: paginationRef.current.pageSize };
                paginationRef.current = next;
                onPaginationChange?.(next);
              } else {
                table.setPageIndex(page);
              }
            }}
            onRecordsPerPageChange={(size) => {
              if (manualPagination) {
                const next = { pageIndex: 0, pageSize: size };
                paginationRef.current = next;
                onPaginationChange?.(next);
              } else {
                table.setPageSize(size);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * @deprecated The legacy `EnhancedTableTemplate` was a domain-specific table
 * hard-coded for `ClientData` rows. The migrated component is a generic
 * `CommonTable<TRow>` requiring `columns` and `data` props. This export is
 * kept as an alias so existing imports keep resolving, but consumers MUST
 * now pass `columns` and `data`.
 */
export const EnhancedTableTemplate = CommonTable;

export default CommonTable;
