import { useEffect, useMemo } from 'react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { RHFAutocomplete, RHFInput } from '../../../common/rhf-wrappers';
import { CustomLabel } from '../../../common/custom-label';
import { useToast } from '../../../common/common-snackbar';
import { useFormApiErrors } from '../../../hooks/useFormApiErrors';
import { ApiError } from '../../../api/client';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import { useAdminUpdateUser } from '../../../sdk/user-management';
import type { UserRow } from '../api/users';
import { useEditUserForm, type EditUserFormValues } from '../hooks/useEditUserForm';
import { useRoleItems, roleLabel } from '../hooks/useRoleItems';

interface EditUserDialogProps {
  user: UserRow | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditUserDialog({ user, onClose, onUpdated }: EditUserDialogProps) {
  const { toast } = useToast();
  const { control, handleSubmit, reset, setError } = useEditUserForm();
  const { handleApiError } = useFormApiErrors(setError);
  const { roleItems, isLoading: rolesLoading } = useRoleItems();

  // The picker only lists assignable (active, non-"user") roles, so a user whose
  // current role is "user" or an inactive role would otherwise show blank. Make
  // sure their existing role is always a selectable option (#104).
  const roleOptions = useMemo(() => {
    if (user && !roleItems.some((i) => i.value === user.role)) {
      return [{ value: user.role, label: roleLabel(user.role) }, ...roleItems];
    }
    return roleItems;
  }, [user, roleItems]);

  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        phone: user.phone ?? '',
        role: user.role,
      });
    }
  }, [user, reset]);

  const updateMutation = useAdminUpdateUser({
    mutation: {
      onSuccess: (response) => {
        // The backend returns the outcome message; show it verbatim.
        toast({ severity: 'success', message: successMessage(response, 'User updated.') });
        onUpdated();
        onClose();
      },
      onError: (error) => {
        if (error instanceof ApiError && (error.status === 403 || error.status === 409)) {
          toast({ severity: 'error', message: errorMessage(error, 'Could not update user.') });
          return;
        }
        const general = handleApiError(error);
        toast({ severity: 'error', message: general ?? errorMessage(error) });
      },
    },
  });

  const onSubmit = (data: EditUserFormValues) => {
    if (!user) return;
    updateMutation.mutate({
      userUuid: user.uuid,
      data: {
        email: data.email,
        first_name: data.first_name || null,
        last_name: data.last_name || null,
        phone: data.phone || null,
        role: data.role,
      },
    });
  };

  return (
    <CustomDrawer
      anchor="right"
      title="Edit user"
      open={user !== null}
      onClose={onClose}
      drawerWidth="42rem"
      drawerPadding="0px"
    >
      {user && (
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex min-h-full flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <RHFInput<EditUserFormValues> name="first_name" control={control} label="First name" required placeholder="Enter first name" />
            <RHFInput<EditUserFormValues> name="last_name" control={control} label="Last name" required placeholder="Enter last name" />
          </div>
          <RHFInput<EditUserFormValues>
            name="email"
            control={control}
            label="Email"
            required
            placeholder="Enter email"
          />
          <RHFInput<EditUserFormValues> name="phone" control={control} label="Phone" phone placeholder="Enter 10-digit mobile" />
          <div className="flex flex-col gap-1">
            <CustomLabel label="Role" htmlFor="role" isRequired />
            <RHFAutocomplete<EditUserFormValues>
              name="role"
              control={control}
              options={roleOptions.map((r) => ({ key: r.value, value: r.label }))}
              hasStartSearchIcon
              isDisabled={rolesLoading}
              placeholder={rolesLoading ? 'Loading roles…' : 'Search role…'}
            />
          </div>
          </div>
          <div className="sticky bottom-0 shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
            <CustomButton type="button" variant="outline" onClick={onClose} size="md">
              Cancel
            </CustomButton>
            <CustomButton type="submit" variant="primary" loading={updateMutation.isPending} size="md">
              Save changes
            </CustomButton>
          </div>
        </form>
      )}
    </CustomDrawer>
  );
}
