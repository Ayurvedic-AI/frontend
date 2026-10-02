import { useMemo, useState, type ReactNode } from 'react';
import { Ban, Eye, Pause, Play } from 'lucide-react';
import { CommonTable, type ColumnDef } from '../../../common/common-table';
import { ActionMenu, type ActionMenuItem } from '../../../common/action-menu';
import { ConfirmationPopUp } from '../../../common/confirmation-pop-up';
import { formatDateTime } from '../../../utils/format';
import { audienceLabel } from './announcement-utils';
import type { AnnouncementScheduleOut } from '../api/announcement-schedules';

const STATUS_PILL: Record<AnnouncementScheduleOut['status'], string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PAUSED: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-muted text-muted-foreground',
  ENDED: 'bg-slate-100 text-slate-600',
};

interface AnnouncementSchedulesTableProps {
  schedules: AnnouncementScheduleOut[];
  loading: boolean;
  busy?: boolean;
  /** Pause/Resume/Cancel require announcements.create (backend has no separate .update). */
  canManage: boolean;
  onView: (schedule: AnnouncementScheduleOut) => void;
  onPause: (uuid: string) => void;
  onResume: (uuid: string) => void;
  onCancel: (uuid: string) => void;
  emptyState?: ReactNode;
}

/**
 * Recurring announcement schedules (feature 053 US3) in the shared `CommonTable`.
 * Each row exposes an `ActionMenu` (View + Pause/Resume + Cancel); cancelling is
 * confirmed first since it permanently stops future sends.
 */
export function AnnouncementSchedulesTable({
  schedules,
  loading,
  busy,
  canManage,
  onView,
  onPause,
  onResume,
  onCancel,
  emptyState,
}: AnnouncementSchedulesTableProps) {
  const [cancelTarget, setCancelTarget] = useState<AnnouncementScheduleOut | null>(null);

  const columns = useMemo<ColumnDef<AnnouncementScheduleOut, unknown>[]>(
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
        accessorKey: 'interval_days',
        header: 'Cadence',
        meta: { align: 'center' },
        cell: ({ row }) => (
          <span className="text-muted-foreground">Every {row.original.interval_days} days</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        meta: { align: 'center' },
        cell: ({ row }) => (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_PILL[row.original.status]}`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: 'next_run_at',
        header: 'Next send',
        meta: { align: 'center' },
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.next_run_at ? formatDateTime(row.original.next_run_at) : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'occurrence_count',
        header: 'Occurrences',
        meta: { align: 'center' },
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">{row.original.occurrence_count}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ row }) => {
          const s = row.original;
          const items: ActionMenuItem[] = [
            { label: 'View', icon: <Eye className="size-4" />, onClick: () => onView(s) },
          ];
          if (canManage && s.status === 'ACTIVE') {
            items.push({
              label: 'Pause',
              icon: <Pause className="size-4" />,
              disabled: busy,
              onClick: () => onPause(s.uuid),
            });
          }
          if (canManage && s.status === 'PAUSED') {
            items.push({
              label: 'Resume',
              icon: <Play className="size-4" />,
              disabled: busy,
              onClick: () => onResume(s.uuid),
            });
          }
          if (canManage && (s.status === 'ACTIVE' || s.status === 'PAUSED')) {
            items.push({
              label: 'Cancel',
              icon: <Ban className="size-4" />,
              color: 'text-red-600',
              disabled: busy,
              onClick: () => setCancelTarget(s),
            });
          }
          return <ActionMenu ariaLabel={`Actions for ${s.title}`} items={items} />;
        },
      },
    ],
    [onView, onPause, onResume, busy, canManage],
  );

  return (
    <>
      <CommonTable<AnnouncementScheduleOut>
        columns={columns}
        data={schedules}
        loading={loading}
        enableSorting
        defaultSorting={[{ id: 'next_run_at', desc: true }]}
        enablePagination
        pageSize={10}
        getRowId={(row) => row.uuid}
        onRowClick={onView}
        emptyState={emptyState}
      />

      <ConfirmationPopUp
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) onCancel(cancelTarget.uuid);
          setCancelTarget(null);
        }}
        title="Cancel recurring announcement?"
        message={
          <span>
            This permanently stops future sends of{' '}
            <strong>{cancelTarget?.title}</strong>. Past occurrences are kept. This cannot be undone.
          </span>
        }
        confirmLabel="Cancel schedule"
        cancelLabel="Keep it"
        destructive
      />
    </>
  );
}
