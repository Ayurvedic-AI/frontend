import { useMemo } from 'react';
import { Eye, Mail, Pencil, Power, Trash2 } from 'lucide-react';
import type { SortingState } from '@tanstack/react-table';
import { CommonTable, type ColumnDef } from '../../../common/common-table';
import { ActionMenu, type ActionMenuItem } from '../../../common/action-menu';
import { usePermissions } from '../../auth/permissions';
import { fullName, formatDateTime } from '../../../utils/format';
import type { UserRow } from '../api/users';
import { RoleBadge } from './RoleBadge';
import { UserStatusPill } from './UserStatusPill';

interface UsersTableProps {
  users: UserRow[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPaginationChange: (state: { pageIndex: number; pageSize: number }) => void;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  onView: (u: UserRow) => void;
  onEdit: (u: UserRow) => void;
  onToggleStatus: (u: UserRow) => void;
  onResend: (u: UserRow) => void;
  onDelete: (u: UserRow) => void;
}

export function UsersTable({
  users,
  loading,
  page,
  pageSize,
  total,
  onPaginationChange,
  sorting,
  onSortingChange,
  onView,
  onEdit,
  onToggleStatus,
  onResend,
  onDelete,
}: UsersTableProps) {
  const { canUpdate, canDelete } = usePermissions();
  const canEditUsers = canUpdate('users');
  const canDeleteUsers = canDelete('users');

  const columns = useMemo<ColumnDef<UserRow, unknown>[]>(
    () => [
      {
        accessorKey: 'email',
        header: 'Email',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.email}</span>
        ),
      },
      {
        id: 'name',
        header: 'Name',
        // Server sorts this column (sort=name).
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-foreground">
            {fullName(row.original.first_name, row.original.last_name)}
          </span>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ row }) => (
          <UserStatusPill
            isActive={row.original.is_active}
            passwordSet={row.original.password_set}
          />
        ),
      },
      {
        id: 'last_login',
        header: 'Last login',
        // Server sorts this column (sort=last_login).
        meta: { align: 'center' },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatDateTime(row.original.last_login_at)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Action',
        enableSorting: false,
        meta: { align: 'center' },
        cell: ({ row }) => {
          const u = row.original;
          const items: ActionMenuItem[] = [
            { label: 'View', icon: <Eye className="size-4" />, onClick: () => onView(u) },
          ];
          // Edit + status-toggle + resend are user-update operations (users.update).
          if (canEditUsers) {
            items.push({ label: 'Edit', icon: <Pencil className="size-4" />, onClick: () => onEdit(u) });
            // A Pending user (invited, no password yet) has nothing to activate or
            // deactivate — hide the status toggle until they've set a password (#104).
            if (u.password_set) {
              items.push({
                label: u.is_active ? 'Deactivate' : 'Activate',
                icon: <Power className="size-4" />,
                onClick: () => onToggleStatus(u),
              });
            }
            if (u.can_resend_set_password_link) {
              items.push({
                label: 'Resend set-password link',
                icon: <Mail className="size-4" />,
                onClick: () => onResend(u),
              });
            }
          }
          // Delete is a delete-class operation (users.delete).
          if (canDeleteUsers) {
            items.push({
              label: 'Delete',
              icon: <Trash2 className="size-4" />,
              color: 'var(--color-destructive)',
              onClick: () => onDelete(u),
            });
          }
          // With no permitted actions there is nothing to open — show a placeholder
          // instead of an empty menu.
          if (items.length === 0) {
            return <span className="text-muted-foreground">—</span>;
          }
          // Stop propagation so opening the actions menu does not also trigger
          // the row-click (which opens the Edit drawer).
          return (
            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
              <ActionMenu items={items} ariaLabel={`Actions for ${u.email}`} />
            </div>
          );
        },
      },
    ],
    [onView, onEdit, onToggleStatus, onResend, onDelete, canEditUsers, canDeleteUsers],
  );

  return (
    <CommonTable<UserRow>
      columns={columns}
      data={users}
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
      getRowId={(row) => row.uuid}
      onRowClick={onView}
      emptyState={
        <div className="py-12 text-center text-sm text-muted-foreground">No users found.</div>
      }
    />
  );
}
