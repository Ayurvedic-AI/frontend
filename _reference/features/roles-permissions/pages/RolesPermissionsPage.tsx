import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldPlus } from 'lucide-react';
import { useState } from 'react';
import { CustomButton } from '../../../common/custom-buttons';
import { CustomSearch } from '../../../common/custom-search';
import { CustomSelect } from '../../../common/custom-select';
import { ConfirmationPopUp } from '../../../common/confirmation-pop-up';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import { usePermissions } from '../../auth/permissions';
import { useAdminSetRoleStatus, useAdminDeleteRole } from '../../../sdk/roles-permissions';
import { useRoles } from '../hooks/useRoles';
import { RolesTable } from '../components/RolesTable';
import { CreateRoleDialog } from '../components/CreateRoleDialog';
import { EditRoleDialog } from '../components/EditRoleDialog';
import type { RoleRow } from '../api/roles';

const STATUS_ITEMS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Deactivated' },
];

const TYPE_ITEMS = [
  { value: 'all', label: 'All role types' },
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'Staff' },
];

type StatusFilter = 'all' | 'active' | 'inactive';
type TypeFilter = 'all' | 'admin' | 'staff';

export function RolesPermissionsPage() {
  const { toast } = useToast();
  const { hasAny } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  // Management actions are enforced server-side by the roles.* permissions; the
  // UI hides them for callers without any roles management grant, who keep
  // read-only access to the list/detail.
  const canManage = hasAny(['roles.create', 'roles.update', 'roles.delete']);

  // List state lives in the URL so navigating into a role page and back (via the
  // page's "Back to roles" link or the browser) restores search/filter/page.
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const status = (searchParams.get('status') as StatusFilter) || 'all';
  const type = (searchParams.get('type') as TypeFilter) || 'all';
  const page = Number(searchParams.get('page') ?? '0') || 0;
  const pageSize = Number(searchParams.get('size') ?? '10') || 10;

  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<RoleRow | null>(null);
  const [deleteRole, setDeleteRole] = useState<RoleRow | null>(null);
  const [statusRole, setStatusRole] = useState<RoleRow | null>(null);

  const { roles, total, isLoading, refetch } = useRoles({
    page,
    pageSize,
    q: search,
    status,
    type,
  });

  // Merge param updates; null/default values are dropped to keep the URL clean.
  const setParams = (updates: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      }
      return next;
    });
  };

  // A new search or filter should always start from the first page.
  const handleSearch = (term: string) => setParams({ q: term || null, page: null });
  const handleStatus = (value: StatusFilter) =>
    setParams({ status: value === 'all' ? null : value, page: null });
  const handleType = (value: TypeFilter) =>
    setParams({ type: value === 'all' ? null : value, page: null });

  const statusMutation = useAdminSetRoleStatus({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'Role status updated.') });
        setStatusRole(null);
        refetch();
      },
      onError: (e) => {
        toast({ severity: 'error', message: errorMessage(e) });
        setStatusRole(null);
      },
    },
  });

  const deleteMutation = useAdminDeleteRole({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'Role deleted.') });
        setDeleteRole(null);
        refetch();
      },
      onError: (e) => {
        toast({ severity: 'error', message: errorMessage(e) });
        setDeleteRole(null);
      },
    },
  });

  // Open the dedicated role page, carrying the current list query so Back can
  // restore exactly this search/filter/page.
  const openRole = (role: RoleRow) =>
    navigate(`/roles-permissions/${role.uuid}`, { state: { fromSearch: location.search } });

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      {/* Header: title left, search right (Activity-Log parity) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Roles &amp; Permissions</h1>
          {/* <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            What each role can see and do across the modules.
          </p> */}
        </div>
        {canManage && (
          <CustomButton
            variant="primary"
            icon={<ShieldPlus className="size-4" />}
            onClick={() => setCreateOpen(true)}
          >
            Add role
          </CustomButton>
        )}
      </div>

      {/* Toolbar — status filter + create */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <div className="w-44">
            <CustomSelect
              name="type"
              placeholder="Role Type"
              value={type}
              items={TYPE_ITEMS}
              onChange={(e) => handleType(e.target.value as TypeFilter)}
            />
          </div>
          <div className="w-44">
            <CustomSelect
              name="status"
              placeholder="Status"
              value={status}
              items={STATUS_ITEMS}
              onChange={(e) => handleStatus(e.target.value as StatusFilter)}
            />
          </div>
          <CustomSearch
            textData={{ placeholder: 'Search by role name', btnTitle: 'Search' }}
            onSearch={handleSearch}
            initialValue={search}
            hasStartSearchIcon
            width="20rem"
          /></div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <RolesTable
          roles={roles}
          loading={isLoading}
          page={page}
          pageSize={pageSize}
          total={total}
          onPaginationChange={({ pageIndex, pageSize: nextSize }) =>
            setParams({
              page: pageIndex ? String(pageIndex) : null,
              size: nextSize === 10 ? null : String(nextSize),
            })
          }
          onRowClick={openRole}
          onEdit={setEditRole}
          onToggleStatus={setStatusRole}
          onDelete={setDeleteRole}
          canManage={canManage}
        />
      </div>

      <CreateRoleDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => refetch()}
      />

      <EditRoleDialog
        role={editRole}
        onClose={() => setEditRole(null)}
        onUpdated={() => refetch()}
      />

      <ConfirmationPopUp
        open={statusRole !== null}
        title={statusRole?.status === 'active' ? 'Deactivate role' : 'Activate role'}
        message={
          statusRole
            ? statusRole.status === 'active'
              ? `Deactivate “${statusRole.name}”? Holders of this role will lose its access.`
              : `Activate “${statusRole.name}”?`
            : ''
        }
        confirmLabel={statusRole?.status === 'active' ? 'Deactivate' : 'Activate'}
        destructive={statusRole?.status === 'active'}
        onClose={() => setStatusRole(null)}
        onConfirm={() => {
          if (statusRole) {
            statusMutation.mutate({
              roleUuid: statusRole.uuid,
              data: { status: statusRole.status === 'active' ? 'inactive' : 'active' },
            });
          }
        }}
      />

      <ConfirmationPopUp
        open={deleteRole !== null}
        title="Delete role"
        message={deleteRole ? `Delete “${deleteRole.name}”? This cannot be undone.` : ''}
        confirmLabel="Delete"
        destructive
        onClose={() => setDeleteRole(null)}
        onConfirm={() => {
          if (deleteRole) deleteMutation.mutate({ roleUuid: deleteRole.uuid });
        }}
      />
    </div>
  );
}

export default RolesPermissionsPage;
