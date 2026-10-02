import { useMemo, type ReactNode } from 'react';
import { Eye } from 'lucide-react';
import { CommonTable, type ColumnDef } from '../../../common/common-table';
import { ActionMenu, type ActionMenuItem } from '../../../common/action-menu';
import { formatDate } from '../../../utils/format';
import { audienceLabel } from './announcement-utils';
import type { AnnouncementOut } from '../api/notifications';

interface AnnouncementsTableProps {
  announcements: AnnouncementOut[];
  loading: boolean;
  /** Open the detail drawer for a row (from the action menu, the row, or the title). */
  onView: (announcement: AnnouncementOut) => void;
  /** Empty-state node (the page decides "none sent yet" vs "no filter matches"). */
  emptyState?: ReactNode;
}

/**
 * Announcements list rendered with the shared `CommonTable` — the same standard
 * presentation every other list screen uses (sorting, density, loading, empty
 * state, client-side pagination). Each row exposes the standard `ActionMenu`
 * with a "View" item; the row and its title also open the detail drawer (052
 * US1/US2/US3, mirroring `GrnsTable`).
 */
export function AnnouncementsTable({ announcements, loading, onView, emptyState }: AnnouncementsTableProps) {
  const columns = useMemo<ColumnDef<AnnouncementOut, unknown>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <button
            type="button"
            title={row.original.title}
            onClick={(e) => {
              e.stopPropagation();
              onView(row.original);
            }}
            className="block max-w-[16rem] truncate text-left font-medium text-primary hover:underline"
          >
            {row.original.title}
          </button>
        ),
      },
      {
        id: 'audience',
        header: 'Audience',
        enableSorting: false,
        cell: ({ row }) => <span className="text-muted-foreground">{audienceLabel(row.original)}</span>,
      },
      {
        accessorKey: 'severity',
        header: 'Severity',
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.severity}</span>,
      },
      {
        accessorKey: 'recipient_count',
        header: 'Recipients',
        meta: { align: 'center' },
        cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.recipient_count}</span>,
      },
      {
        id: 'acknowledged',
        header: 'Acknowledged',
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.requires_acknowledgment
              ? `${row.original.acknowledged_count}/${row.original.recipient_count}`
              : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'sent_at',
        header: 'Sent',
        meta: { align: 'center' },
        cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.sent_at)}</span>,
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ row }) => {
          const items: ActionMenuItem[] = [
            { label: 'View', icon: <Eye className="size-4" />, onClick: () => onView(row.original) },
          ];
          return <ActionMenu ariaLabel={`Actions for ${row.original.title}`} items={items} />;
        },
      },
    ],
    [onView],
  );

  return (
    <CommonTable<AnnouncementOut>
      columns={columns}
      data={announcements}
      loading={loading}
      enableSorting
      defaultSorting={[{ id: 'sent_at', desc: true }]}
      enablePagination
      pageSize={10}
      getRowId={(row) => row.uuid}
      onRowClick={onView}
      emptyState={emptyState}
    />
  );
}
