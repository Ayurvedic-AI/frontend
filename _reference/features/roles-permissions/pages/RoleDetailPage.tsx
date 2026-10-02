import { useMemo, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, ListChecks, Pencil, Power, Save, Trash2, X } from 'lucide-react';
import { CustomButton } from '../../../common/custom-buttons';
import { ConfirmationPopUp } from '../../../common/confirmation-pop-up';
import { useToast } from '../../../common/common-snackbar';
import { cn } from '../../../lib/cn';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import { usePermissions } from '../../auth/permissions';
import {
  useAdminSetRoleStatus,
  useAdminDeleteRole,
  useAdminGrantPermissions,
  useAdminRevokePermissions,
} from '../../../sdk/roles-permissions';
import { useRoleDetail } from '../hooks/useRoleDetail';
import { orderFeaturesBySidebar } from '../feature-order';
import { RoleStatusBadge } from '../components/RoleStatusBadge';
import { PermissionGrid } from '../components/PermissionGrid';
import { EditRoleDialog } from '../components/EditRoleDialog';
import type { FeatureRow, RoleRow } from '../api/roles';

/** Tier badge (admin / staff) — mirrors the list/table treatment. */
function TierBadge({ tier }: { tier: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        tier === 'admin' ? 'bg-primary/10 text-primary' : 'bg-info/10 text-info',
      )}
    >
      {tier}
    </span>
  );
}

/** Granted permission names across a feature×action matrix. */
function grantedNames(matrix: FeatureRow[]): Set<string> {
  const out = new Set<string>();
  for (const row of matrix) {
    for (const cell of row.cells) {
      if (cell.applicable && cell.granted) out.add(cell.permission);
    }
  }
  return out;
}

/**
 * Dedicated role page (route `roles-permissions/:roleUuid`). Renders the role's
 * metadata, the feature×action permission grid (view mode), and an "Edit
 * Permissions" mode (checkboxes + Select All / Cancel / Save Changes with a live
 * change counter) that persists via the grant/revoke endpoints. Role identity
 * actions (Edit role / Deactivate / Delete) live in the header.
 */
export function RoleDetailPage() {
  const { roleUuid } = useParams<{ roleUuid: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { hasAny } = usePermissions();
  const canManage = hasAny(['roles.create', 'roles.update', 'roles.delete']);

  const fromSearch = (location.state as { fromSearch?: string } | null)?.fromSearch ?? '';
  const backTo = `/roles-permissions${fromSearch}`;

  const { role, isLoading, isError, refetch } = useRoleDetail(roleUuid);

  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Permission edit mode: `selected` holds the in-progress grant set.
  const [editingPerms, setEditingPerms] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Order the grid rows to match the sidebar (#110); the backend catalog order differs.
  const matrix = useMemo<FeatureRow[]>(() => orderFeaturesBySidebar(role?.matrix ?? []), [role]);
  const original = useMemo(() => grantedNames(matrix), [matrix]);

  // Count permissions whose membership differs between the edit set and server.
  const changeCount = useMemo(() => {
    let n = 0;
    for (const p of selected) if (!original.has(p)) n += 1;
    for (const p of original) if (!selected.has(p)) n += 1;
    return n;
  }, [selected, original]);

  const allApplicable = useMemo(
    () => matrix.flatMap((r) => r.cells.filter((c) => c.applicable).map((c) => c.permission)),
    [matrix],
  );

  const statusMutation = useAdminSetRoleStatus({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'Role status updated.') });
        setConfirmStatus(false);
        refetch();
      },
      onError: (e) => {
        toast({ severity: 'error', message: errorMessage(e) });
        setConfirmStatus(false);
      },
    },
  });

  const deleteMutation = useAdminDeleteRole({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'Role deleted.') });
        navigate(backTo);
      },
      onError: (e) => {
        toast({ severity: 'error', message: errorMessage(e) });
        setConfirmDelete(false);
      },
    },
  });

  const grantMutation = useAdminGrantPermissions();
  const revokeMutation = useAdminRevokePermissions();
  const savingPerms = grantMutation.isPending || revokeMutation.isPending;

  const isActive = role?.status === 'active';

  const startEditPerms = () => {
    setSelected(new Set(original));
    setEditingPerms(true);
  };
  const cancelEditPerms = () => {
    setEditingPerms(false);
    setSelected(new Set(original));
  };
  const toggle = (permission: string, checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(permission);
      else next.delete(permission);
      return next;
    });
  const toggleRow = (permissions: string[], checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of permissions) {
        if (checked) next.add(p);
        else next.delete(p);
      }
      return next;
    });
  const selectAll = () => setSelected(new Set(allApplicable));

  const savePerms = async () => {
    if (!role || changeCount === 0) {
      setEditingPerms(false);
      return;
    }
    const added = [...selected].filter((p) => !original.has(p));
    const removed = [...original].filter((p) => !selected.has(p));
    try {
      let last: unknown;
      if (added.length)
        last = await grantMutation.mutateAsync({ roleUuid: role.uuid, data: { permissions: added } });
      if (removed.length)
        last = await revokeMutation.mutateAsync({
          roleUuid: role.uuid,
          data: { permissions: removed },
        });
      toast({ severity: 'success', message: successMessage(last, 'Permissions updated.') });
      setEditingPerms(false);
      refetch();
    } catch (e) {
      toast({ severity: 'error', message: errorMessage(e) });
    }
  };

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <button
        type="button"
        onClick={() => navigate(backTo)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to roles
      </button>

      {isLoading && !role ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-9 animate-spin text-primary" aria-hidden />
        </div>
      ) : isError || !role ? (
        <p className="mt-10 text-center text-sm text-destructive">
          Could not load this role's permissions.
        </p>
      ) : (
        <>
          {/* Metadata header — name, tier, status, description + identity actions. */}
          <div className="mt-4 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold capitalize text-foreground">{role.name}</h1>
                <TierBadge tier={role.type} />
                <RoleStatusBadge status={role.status} />
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {role.description || 'No description.'}
              </p>
            </div>

            {canManage && !editingPerms && (
              <div className="flex flex-wrap gap-3 sm:justify-end">
                <CustomButton
                  type="button"
                  variant="outline"
                  icon={<Power className="size-4" />}
                  onClick={() => setConfirmStatus(true)}
                >
                  {isActive ? 'Deactivate' : 'Activate'}
                </CustomButton>
                {!role.is_system && (
                  <CustomButton
                    type="button"
                    variant="destructive"
                    icon={<Trash2 className="size-4" />}
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete
                  </CustomButton>
                )}
                <CustomButton
                  type="button"
                  variant="primary"
                  icon={<Pencil className="size-4" />}
                  onClick={() => setEditRoleOpen(true)}
                >
                  Edit role
                </CustomButton>
              </div>
            )}
          </div>

          {/* Permission grid toolbar */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-foreground">Permissions</h2>
            {canManage &&
              (editingPerms ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-info/10 px-3 py-1 text-xs font-medium text-info">
                    {changeCount} {changeCount === 1 ? 'Change' : 'Changes'}
                  </span>
                  <CustomButton type="button" variant="outline" onClick={selectAll}>
                    Select All
                  </CustomButton>
                  <CustomButton
                    type="button"
                    variant="outline"
                    icon={<X className="size-4" />}
                    onClick={cancelEditPerms}
                    disabled={savingPerms}
                  >
                    Cancel
                  </CustomButton>
                  <CustomButton
                    type="button"
                    variant="primary"
                    icon={<Save className="size-4" />}
                    onClick={savePerms}
                    loading={savingPerms}
                    disabled={changeCount === 0}
                  >
                    Save Changes
                  </CustomButton>
                </div>
              ) : (
                <CustomButton
                  type="button"
                  variant="primary"
                  icon={<ListChecks className="size-4" />}
                  onClick={startEditPerms}
                >
                  Edit Permissions
                </CustomButton>
              ))}
          </div>

          {/* Feature × action grid */}
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <PermissionGrid
              matrix={matrix}
              editing={editingPerms}
              selected={selected}
              onToggle={toggle}
              onToggleRow={toggleRow}
            />
          </div>

          <EditRoleDialog
            role={editRoleOpen ? (role as RoleRow) : null}
            onClose={() => setEditRoleOpen(false)}
            onUpdated={() => {
              setEditRoleOpen(false);
              refetch();
            }}
          />

          <ConfirmationPopUp
            open={confirmStatus}
            title={isActive ? 'Deactivate role' : 'Activate role'}
            message={
              isActive
                ? `Deactivate “${role.name}”? Holders of this role will lose its access.`
                : `Activate “${role.name}”?`
            }
            confirmLabel={isActive ? 'Deactivate' : 'Activate'}
            destructive={isActive}
            onClose={() => setConfirmStatus(false)}
            onConfirm={() =>
              statusMutation.mutate({
                roleUuid: role.uuid,
                data: { status: isActive ? 'inactive' : 'active' },
              })
            }
          />

          <ConfirmationPopUp
            open={confirmDelete}
            title="Delete role"
            message={`Delete “${role.name}”? This cannot be undone.`}
            confirmLabel="Delete"
            destructive
            onClose={() => setConfirmDelete(false)}
            onConfirm={() => deleteMutation.mutate({ roleUuid: role.uuid })}
          />
        </>
      )}
    </div>
  );
}

export default RoleDetailPage;
