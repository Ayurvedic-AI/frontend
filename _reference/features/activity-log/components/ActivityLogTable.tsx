import { useMemo } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { formatDateTime, formatRelativeTime } from '../../../utils/format';
import { CommonTable, type ColumnDef } from '../../../common/common-table';
import type { AuditRow } from '../api/activity-log';
import { ActivityAction } from './ActivityAction';

interface ActivityLogTableProps {
  entries: AuditRow[];
  loading: boolean;
  onRowClick: (entry: AuditRow) => void;
  page: number;
  pageSize: number;
  total: number;
  onPaginationChange: (state: { pageIndex: number; pageSize: number }) => void;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
}

export function ActivityLogTable({
  entries,
  loading,
  onRowClick,
  page,
  pageSize,
  total,
  onPaginationChange,
  sorting,
  onSortingChange,
}: ActivityLogTableProps) {
  const columns = useMemo<ColumnDef<AuditRow, unknown>[]>(
    () => [
      {
        id: 'when',
        header: 'When',
        meta: { align: 'center' },
        cell: ({ row }) => (
          <span
            className="whitespace-nowrap text-muted-foreground"
            title={formatDateTime(row.original.created_at)}
          >
            {formatRelativeTime(row.original.created_at)}
          </span>
        ),
      },
      {
        accessorKey: 'action',
        header: 'Activity',
        cell: ({ row }) => (
          <ActivityAction action={row.original.action} entityType={row.original.entity_type} />
        ),
      },
      {
        id: 'who',
        header: 'By',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-foreground">{row.original.actor?.name ?? row.original.actor?.email ?? 'System'}</span>
            {row.original.actor?.role && (
              <span className="text-xs capitalize text-muted-foreground">
                {row.original.actor?.role}
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'record',
        header: 'Record',
        enableSorting: false,
        cell: ({ row }) => {
          const { entity_type, record_id, record_name } = row.original;
          // Prefer the human label resolved by the API (e.g. a user's name).
          if (record_name) {
            return <span className="text-foreground">{record_name}</span>;
          }
          if (!entity_type && record_id == null) {
            return <span className="text-muted-foreground">—</span>;
          }
          const name = entity_type
            ? entity_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            : 'Record';
          return (
            <span className="text-foreground">
              {name}
              {record_id != null && <span className="text-muted-foreground"> #{record_id}</span>}
            </span>
          );
        },
      },
    ],
    [],
  );

  return (
    <CommonTable<AuditRow>
      columns={columns}
      data={entries}
      loading={loading}
      enableSorting
      manualSorting
      sorting={sorting}
      onSortingChange={onSortingChange}
      enablePagination
      manualPagination
      pageIndex={page}
      pageSize={pageSize}
      rowCount={total}
      onPaginationChange={onPaginationChange}
      stickyHeader
      maxHeight="calc(100vh - 16rem)"
      getRowId={(row) => String(row.id)}
      onRowClick={onRowClick}
      emptyState={
        <div className="py-12 text-center text-sm text-muted-foreground">
          No activity recorded yet.
        </div>
      }
    />
  );
}
