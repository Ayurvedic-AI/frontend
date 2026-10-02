import { useMemo } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { Eye, Pencil, Power } from 'lucide-react';
import { formatAddress, formatDate } from '../../../utils/format';
import { formatIndianPhone } from '../../../utils/phone';
import { WhatsAppTemplateButton } from '../../../common/whatsapp-button';
import { CommonTable, type ColumnDef } from '../../../common/common-table';
import { ActionMenu } from '../../../common/action-menu';
import type { VendorRow } from '../api/vendors';
import { ActivePill } from './ActivePill';

export interface VendorsTableProps {
  vendors: VendorRow[];
  loading: boolean;
  /** Server-side list state (feature 027). */
  rowCount: number;
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  onPaginationChange: (state: { pageIndex: number; pageSize: number }) => void;
  onSortingChange: (sorting: SortingState) => void;
  onView: (vendor: VendorRow) => void;
  onEdit: (vendor: VendorRow) => void;
  onToggleStatus: (vendor: VendorRow) => void;
}

export function VendorsTable({
  vendors,
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
}: VendorsTableProps) {
  const columns = useMemo<ColumnDef<VendorRow, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => <span title={row.original.name} className="font-medium text-foreground">{row.original.name}</span>,
      },
      {
        accessorKey: 'phone',
        header: 'Contact Number',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.phone ? (
            <span className="flex items-center gap-1.5 whitespace-nowrap text-foreground">
              {formatIndianPhone(row.original.phone)}
              <WhatsAppTemplateButton
                phone={row.original.phone}
                context="GENERAL"
                fill={{ name: row.original.name, city: row.original.city }}
                ariaLabel={`Message ${row.original.name} on WhatsApp`}
              />
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        enableSorting: false,
        cell: ({ row }) => <span className="text-foreground">{row.original.email || '—'}</span>,
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
    <CommonTable<VendorRow>
      columns={columns}
      data={vendors}
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
          No vendors yet. Click “Add vendor” to create the first one.
        </div>
      }
    />
  );
}
