import { useEffect } from 'react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { RHFInput, RHFSelect, RHFTextarea } from '../../../common/rhf-wrappers';
import { useToast } from '../../../common/common-snackbar';
import { useFormApiErrors } from '../../../hooks/useFormApiErrors';
import { ApiError } from '../../../api/client';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import { useAdminUpdateRole } from '../../../sdk/roles-permissions';
import type { RoleRow } from '../api/roles';
import { useEditRoleForm, type EditRoleFormValues } from '../hooks/useEditRoleForm';

const TIER_ITEMS = [
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
];

const asTier = (t: string): 'admin' | 'staff' => (t === 'admin' ? 'admin' : 'staff');

interface EditRoleDialogProps {
  role: RoleRow | null;
  onClose: () => void;
  onUpdated: () => void;
}

/**
 * "Edit role" updates a role's identity/description via PATCH /admin/roles/{uuid}.
 * Permissions are NOT edited here (feature 023) — they are managed from the role
 * page's grid. Built-in (system) roles keep their name and tier locked.
 */
export function EditRoleDialog({ role, onClose, onUpdated }: EditRoleDialogProps) {
  const { toast } = useToast();
  const { control, handleSubmit, reset, setError } = useEditRoleForm();
  const { handleApiError } = useFormApiErrors(setError);

  const updateMutation = useAdminUpdateRole();
  const isSaving = updateMutation.isPending;

  const isSystem = role?.is_system ?? false;

  useEffect(() => {
    if (role) {
      reset({
        name: role.name,
        description: role.description,
        type: asTier(role.type),
      });
    }
  }, [role, reset]);

  const onSubmit = async (data: EditRoleFormValues) => {
    if (!role) return;

    try {
      // Identity/description — for system roles only description is sent (name
      // and tier are locked and unchanged).
      const response = await updateMutation.mutateAsync({
        roleUuid: role.uuid,
        data: isSystem
          ? { description: data.description }
          : { name: data.name, type: data.type, description: data.description },
      });
      // The backend returns the outcome message; show it verbatim.
      toast({ severity: 'success', message: successMessage(response, 'Role updated.') });
      onUpdated();
      onClose();
    } catch (error) {
      if (error instanceof ApiError && (error.status === 409 || error.status === 422)) {
        setError('name', { type: 'manual', message: errorMessage(error, 'Could not update role.') });
        return;
      }
      const general = handleApiError(error);
      toast({ severity: 'error', message: general ?? errorMessage(error) });
    }
  };

  return (
    <CustomDrawer anchor="right" title="Edit role" open={role !== null} onClose={onClose} drawerWidth="34rem" drawerPadding="0px">
      {role && (
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex min-h-full flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
            <RHFInput<EditRoleFormValues>
              name="name"
              control={control}
              label="Name"
              required
              disableField={isSystem}
              placeholder="Enter role name"
            />
            <RHFTextarea<EditRoleFormValues>
              name="description"
              control={control}
              label="Description"
              required
              minRow={3}
              placeholder="What can this role do?"
            />
            <RHFSelect<EditRoleFormValues>
              name="type"
              control={control}
              label="Tier"
              required
              isDisabled={isSystem}
              placeholder="Select tier"
              items={TIER_ITEMS}
            />
            {isSystem && (
              <p className="-mt-2 text-xs text-muted-foreground">
                Built-in role — name and tier are managed by the system and cannot be changed.
              </p>
            )}
          </div>
          <div className="shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
            <CustomButton type="button" variant="outline" onClick={onClose}>
              Cancel
            </CustomButton>
            <CustomButton type="submit" variant="primary" loading={isSaving}>
              Save changes
            </CustomButton>
          </div>
        </form>
      )}
    </CustomDrawer>
  );
}
