import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { RHFAutocomplete, RHFInput } from '../../../common/rhf-wrappers';
import { CustomLabel } from '../../../common/custom-label';
import { useToast } from '../../../common/common-snackbar';
import { useFormApiErrors } from '../../../hooks/useFormApiErrors';
import { ApiError } from '../../../api/client';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import { useAdminCreateUser } from '../../../sdk/user-management';
import { useCreateUserForm, type CreateUserFormValues } from '../hooks/useCreateUserForm';
import { useRoleItems } from '../hooks/useRoleItems';

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateUserDialog({ open, onClose, onCreated }: CreateUserDialogProps) {
  const { toast } = useToast();
  const { roleItems, isLoading: rolesLoading } = useRoleItems();
  const { control, handleSubmit, reset, setError } = useCreateUserForm();
  const { handleApiError } = useFormApiErrors(setError);

  const createMutation = useAdminCreateUser({
    mutation: {
      onSuccess: (response) => {
        // The backend returns the outcome message; show it verbatim.
        toast({ severity: 'success', message: successMessage(response, 'User created.') });
        reset();
        onCreated();
        onClose();
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          setError('email', { type: 'manual', message: errorMessage(error) });
          return;
        }
        const general = handleApiError(error);
        toast({ severity: 'error', message: general ?? errorMessage(error) });
      },
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: CreateUserFormValues) => {
    createMutation.mutate({
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
      title="Create user"
      open={open}
      onClose={handleClose}
      drawerWidth="42rem"
      drawerPadding="0px"
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex min-h-full flex-col">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RHFInput<CreateUserFormValues> name="first_name" control={control} label="First name" required placeholder="Enter first name" />
            <RHFInput<CreateUserFormValues> name="last_name" control={control} label="Last name" required placeholder="Enter last name" />
          </div>
          <RHFInput<CreateUserFormValues>
            name="email"
            control={control}
            label="Email"
            required
            placeholder="Enter email"
          />
          <RHFInput<CreateUserFormValues> name="phone" control={control} label="Phone" phone placeholder="Enter 10-digit mobile" />
          <div className="flex flex-col gap-1">
            <CustomLabel label="Role" htmlFor="role" isRequired />
            <RHFAutocomplete<CreateUserFormValues>
              name="role"
              control={control}
              options={roleItems.map((r) => ({ key: r.value, value: r.label }))}
              hasStartSearchIcon
              isDisabled={rolesLoading}
              placeholder={rolesLoading ? 'Loading roles…' : 'Search role…'}
            />
          </div>
        </div>
        <div className="sticky bottom-0 shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
          <CustomButton type="button" variant="outline" onClick={handleClose} size="md">
            Cancel
          </CustomButton>
          <CustomButton type="submit" variant="primary" loading={createMutation.isPending} size="md">
            Create user
          </CustomButton>
        </div>
      </form>
    </CustomDrawer>
  );
}
