import { useMemo } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { Eye, Pencil, Power, Star, UserRound } from 'lucide-react';
import { CommonTable, type ColumnDef } from '../../../common/common-table';
import { ActionMenu } from '../../../common/action-menu';
import { WhatsAppTemplateButton } from '../../../common/whatsapp-button';
import { formatAddress } from '../../../utils/format';
import { formatIndianPhone } from '../../../utils/phone';
import type { DoctorRow } from '../api/doctors';
import { ActivePill } from './ActivePill';

export interface DoctorsTableProps {
  doctors: DoctorRow[];
  loading: boolean;
  /** Server-side list state (feature 027). */
  rowCount: number;
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  onPaginationChange: (state: { pageIndex: number; pageSize: number }) => void;
  onSortingChange: (sorting: SortingState) => void;
  onView: (doctor: DoctorRow) => void;
  onEdit: (doctor: DoctorRow) => void;
  /** Opens the Doctor 360 drawer (orders/payments/statement/pricing). */
  onDoctor360?: (doctor: DoctorRow) => void;
  onToggleStatus: (doctor: DoctorRow) => void;
  onToggleVip: (doctor: DoctorRow) => void;
}

export function DoctorsTable({
  doctors,
  loading,
  rowCount,
  pageIndex,
  pageSize,
  sorting,
  onPaginationChange,
  onSortingChange,
  onView,
  onEdit,
  onDoctor360,
  onToggleStatus,
  onToggleVip,
}: DoctorsTableProps) {
  const columns = useMemo<ColumnDef<DoctorRow, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            {row.original.is_vip && (
              <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-500" aria-label="VIP" />
            )}
            <span className="font-medium text-foreground">{row.original.name}</span>
            {row.original.is_vip && (
              <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                VIP
              </span>
            )}
          </span>
        ),
      },
      {
        id: 'aliases',
        header: 'Alias',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.aliases?.length ? (
            <span
              title={row.original.aliases.join(', ')}
              className="block max-w-[16rem] truncate text-foreground"
            >
              {row.original.aliases.join(', ')}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'clinic_name',
        header: 'Clinic',
        enableSorting: false,
        cell: ({ row }) => <span className="text-foreground">{row.original.clinic_name ?? '—'}</span>,
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.phone ? (
            <span className="flex items-center gap-1.5 whitespace-nowrap text-foreground">
              {formatIndianPhone(row.original.phone)}
              <WhatsAppTemplateButton
                phone={row.original.phone}
                context="GREETING"
                fill={{ name: row.original.name, clinic: row.original.clinic_name, city: row.original.city }}
                ariaLabel={`Message ${row.original.name} on WhatsApp`}
              />
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: 'address',
        header: 'Address',
        enableSorting: false,
        cell: ({ row }) => (
          <span title={formatAddress(row.original)} className="block max-w-[22rem] truncate text-foreground">{formatAddress(row.original)}</span>
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
              ...(onDoctor360
                ? [{
                    label: 'Doctor 360',
                    icon: <UserRound className="size-4" />,
                    onClick: () => onDoctor360(row.original),
                  }]
                : []),
              {
                label: row.original.is_vip ? 'Remove VIP' : 'Mark as VIP',
                icon: <Star className="size-4" />,
                onClick: () => onToggleVip(row.original),
              },
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
    [onView, onEdit, onToggleStatus, onToggleVip, onDoctor360],
  );

  return (
    <CommonTable<DoctorRow>
      columns={columns}
      data={doctors}
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
          No doctors yet. Click “Add doctor” to create the first one.
        </div>
      }
    />
  );
}
