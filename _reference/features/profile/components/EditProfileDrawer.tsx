import { useEffect } from 'react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { RHFInput } from '../../../common/rhf-wrappers';
import { useToast } from '../../../common/common-snackbar';
import { useFormApiErrors } from '../../../hooks/useFormApiErrors';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import { useAuthUpdateProfile } from '../../../sdk/authentication';
import type { MeResponse } from '../../../sdk/schemas';
import { useEditProfileForm, type EditProfileFormValues } from '../hooks/useEditProfileForm';

export interface EditProfileDrawerProps {
  user: MeResponse;
  open: boolean;
  onClose: () => void;
  /** Refresh the cached /auth/me so the page + sidebar reflect the new values. */
  onUpdated: () => void;
}

export function EditProfileDrawer({ user, open, onClose, onUpdated }: EditProfileDrawerProps) {
  const { toast } = useToast();
  const { control, handleSubmit, reset, setError } = useEditProfileForm();
  const { handleApiError } = useFormApiErrors(setError);

  useEffect(() => {
    if (open) {
      reset({
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        phone: user.phone ?? '',
      });
    }
  }, [open, user, reset]);

  const updateMutation = useAuthUpdateProfile({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'Profile updated.') });
        onUpdated();
        onClose();
      },
      onError: (error) => {
        const general = handleApiError(error);
        toast({ severity: 'error', message: general ?? errorMessage(error, 'Could not update profile.') });
      },
    },
  });

  const onSubmit = (data: EditProfileFormValues) => {
    updateMutation.mutate({
      data: {
        first_name: data.first_name || null,
        last_name: data.last_name || null,
        phone: data.phone || null,
      },
    });
  };

  return (
    <CustomDrawer
      anchor="right"
      title="Edit profile"
      open={open}
      onClose={onClose}
      drawerWidth="34rem"
      drawerPadding="0rem"
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RHFInput<EditProfileFormValues>
              name="first_name"
              control={control}
              label="First name"
              placeholder="Enter first name"
              maxLength={100}
              required
            />
            <RHFInput<EditProfileFormValues>
              name="last_name"
              control={control}
              label="Last name"
              placeholder="Enter last name"
              maxLength={100}
              required
            />
          </div>
          <ReadOnlyField label="Email" value={user.email} />
          <RHFInput<EditProfileFormValues>
            name="phone"
            control={control}
            label="Phone"
            placeholder="Enter 10-digit mobile"
            phone
          />
          <ReadOnlyField label="Role" value={user.role} capitalize />
        </div>

        <div className="flex justify-end gap-2 border-t border-border bg-background p-3">
          <CustomButton type="button" variant="outline" size="md" onClick={onClose}>
            Cancel
          </CustomButton>
          <CustomButton type="submit" variant="primary" size="md" loading={updateMutation.isPending}>
            Save changes
          </CustomButton>
        </div>
      </form>
    </CustomDrawer>
  );
}

function ReadOnlyField({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div
        className={`rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground ${
          capitalize ? 'capitalize' : ''
        }`}
      >
        {value}
      </div>
    </div>
  );
}
