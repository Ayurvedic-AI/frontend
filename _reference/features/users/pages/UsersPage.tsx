import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import type { SortingState } from '@tanstack/react-table';
import { CustomSearch } from '../../../common/custom-search';
import { CustomSelect } from '../../../common/custom-select';
import { ConfirmationPopUp } from '../../../common/confirmation-pop-up';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import {
  useAdminSetUserStatus,
  useAdminResendInvitation,
  useAdminSoftDeleteUser,
} from '../../../sdk/user-management';
import { useAuth } from '../../auth';
import { PermissionButton } from '../../auth/permissions';
import { useUsers } from '../hooks/useUsers';
import { useRoleItems } from '../hooks/useRoleItems';
import { UsersTable } from '../components/UsersTable';
import { CreateUserDialog } from '../components/CreateUserDialog';
import { EditUserDialog } from '../components/EditUserDialog';
import { UserViewDrawer } from '../components/user-view-drawer';
import type { UserRow, AdminListUsersStatus, AdminListUsersSort } from '../api/users';

const STATUS_ITEMS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'inactive', label: 'Inactive' },
];

export function UsersPage() {
  const { toast } = useToast();
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AdminListUsersStatus>('all');
  const [role, setRole] = useState<string>('all');
  // All active role names for the filter (sourced from the user-mgmt endpoint,
  // so a user-manager without roles.view still gets the full list).
  const { allRoleItems } = useRoleItems();
  const roleFilterItems = [{ value: 'all', label: 'All roles' }, ...allRoleItems];
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [viewUser, setViewUser] = useState<UserRow | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);

  const sort = sorting[0]?.id as AdminListUsersSort | undefined;
  const order: 'asc' | 'desc' | undefined = sorting[0]
    ? sorting[0].desc
      ? 'desc'
      : 'asc'
    : undefined;

  const { users: rawUsers, total: rawTotal, isLoading, refetch } = useUsers({
    page,
    pageSize,
    q: search,
    status,
    role: role === 'all' ? undefined : role,
    sort,
    order,
  });

  const users = rawUsers.filter((u) => u.uuid !== me?.uuid);
  const total = users.length < rawUsers.length ? rawTotal - 1 : rawTotal;

  // A new search, filter, or sort should always start from the first page.
  const handleSearch = (term: string) => {
    setSearch(term);
    setPage(0);
  };
  const handleStatus = (value: AdminListUsersStatus) => {
    setStatus(value);
    setPage(0);
  };
  const handleRole = (value: string) => {
    setRole(value);
    setPage(0);
  };
  const handleSort = (next: SortingState) => {
    setSorting(next);
    setPage(0);
  };

  // Success toasts show the BACKEND's message (AdminUserOut/AdminResendOut
  // `message`); the fallback only covers responses that can't carry one.
  const statusMutation = useAdminSetUserStatus({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'User status updated.') });
        refetch();
      },
      onError: (e) => toast({ severity: 'error', message: errorMessage(e) }),
    },
  });

  const resendMutation = useAdminResendInvitation({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'Set-password link re-sent.') });
        refetch();
      },
      onError: (e) => toast({ severity: 'error', message: errorMessage(e) }),
    },
  });

  const deleteMutation = useAdminSoftDeleteUser({
    mutation: {
      onSuccess: (response) => {
        // DELETE returns 204 (no body), so this one keeps a local fallback.
        toast({ severity: 'success', message: successMessage(response, 'User deleted.') });
        setDeleteUser(null);
        refetch();
      },
      onError: (e) => {
        toast({ severity: 'error', message: errorMessage(e) });
        setDeleteUser(null);
      },
    },
  });

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      {/* Header: title left, search right (Activity-Log parity) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Users</h1>
          {/* <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Team accounts, roles and access status.
          </p> */}
        </div>
         <PermissionButton
            permission="users.create"
            deniedTooltip="You don't have permission to create users"
            variant="primary"
            icon={<UserPlus className="size-4" />}
            onClick={() => setCreateOpen(true)}
          >
            Create user
          </PermissionButton>
      </div>

      {/* Toolbar — count left; filters + create right */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <div className="w-44">
            <CustomSelect
              name="status"
              placeholder="Status"
              value={status}
              items={STATUS_ITEMS}
              onChange={(e) => handleStatus(e.target.value as AdminListUsersStatus)}
            />
          </div>
          <div className="w-44">
            <CustomSelect
              name="role"
              placeholder="Role"
              value={role}
              items={roleFilterItems}
              onChange={(e) => handleRole(e.target.value)}
            />
          </div>
          <CustomSearch
            textData={{ placeholder: 'Search by email or name', btnTitle: 'Search' }}
            onSearch={handleSearch}
            hasStartSearchIcon
            width="20rem"
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <UsersTable
          users={users}
          loading={isLoading}
          page={page}
          pageSize={pageSize}
          total={total}
          onPaginationChange={({ pageIndex, pageSize: nextSize }) => {
            setPage(pageIndex);
            setPageSize(nextSize);
          }}
          sorting={sorting}
          onSortingChange={handleSort}
          onView={setViewUser}
          onEdit={setEditUser}
          onToggleStatus={(u) =>
            statusMutation.mutate({ userUuid: u.uuid, data: { is_active: !u.is_active } })
          }
          onResend={(u) => resendMutation.mutate({ userUuid: u.uuid })}
          onDelete={setDeleteUser}
        />
      </div>

      <UserViewDrawer
        open={viewUser !== null}
        user={viewUser}
        onClose={() => setViewUser(null)}
        onEdit={(u) => {
          setViewUser(null);
          setEditUser(u);
        }}
      />

      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => refetch()}
      />

      <EditUserDialog user={editUser} onClose={() => setEditUser(null)} onUpdated={() => refetch()} />

      <ConfirmationPopUp
        open={deleteUser !== null}
        title="Delete user"
        message={
          deleteUser
            ? `Soft-delete ${deleteUser.email}? They can be restored from the admin dashboard.`
            : ''
        }
        destructive
        confirmLabel="Delete"
        onClose={() => setDeleteUser(null)}
        onConfirm={() => {
          if (deleteUser) deleteMutation.mutate({ userUuid: deleteUser.uuid });
        }}
      />
    </div>
  );
}

export default UsersPage;
