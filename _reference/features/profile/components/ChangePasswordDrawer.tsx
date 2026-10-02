import { useEffect } from 'react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { RHFInput } from '../../../common/rhf-wrappers';
import { useToast } from '../../../common/common-snackbar';
import { useFormApiErrors } from '../../../hooks/useFormApiErrors';
import { ApiError } from '../../../api/client';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import { useAuthChangePassword } from '../../../sdk/authentication';
import {
  useChangePasswordForm,
  type ChangePasswordFormValues,
} from '../hooks/useChangePasswordForm';

export interface ChangePasswordDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordDrawer({ open, onClose }: ChangePasswordDrawerProps) {
  const { toast } = useToast();
  const { control, handleSubmit, reset, setError } = useChangePasswordForm();
  const { handleApiError } = useFormApiErrors(setError);

  useEffect(() => {
    if (open) reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
  }, [open, reset]);

  const changeMutation = useAuthChangePassword({
    mutation: {
      onSuccess: (response) => {
        // 204 No Content — there is no backend message body, so a fallback is shown.
        toast({ severity: 'success', message: successMessage(response, 'Password changed successfully.') });
        onClose();
      },
      onError: (error) => {
        // Wrong current password is a 401 (AuthError) — surface it on the field.
        if (error instanceof ApiError && error.status === 401) {
          setError('currentPassword', { message: 'Current password is incorrect.' });
          toast({ severity: 'error', message: errorMessage(error, 'Current password is incorrect.') });
          return;
        }
        // Policy 422 and anything else: field errors where mapped, else snackbar.
        const general = handleApiError(error);
        toast({ severity: 'error', message: general ?? errorMessage(error, 'Could not change password.') });
      },
    },
  });

  const onSubmit = (data: ChangePasswordFormValues) => {
    changeMutation.mutate({
      data: { current_password: data.currentPassword, new_password: data.newPassword },
    });
  };

  return (
    <CustomDrawer
      anchor="right"
      title="Change password"
      open={open}
      onClose={onClose}
      drawerWidth="34rem"
      drawerPadding="0rem"
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex h-full flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-2 sm:p-6">
          <RHFInput<ChangePasswordFormValues>
          name="currentPassword"
          control={control}
          label="Current password"
          placeholder="Enter current password"
          isPassword
          required
          autoComplete="current-password"
        />
        <RHFInput<ChangePasswordFormValues>
          name="newPassword"
          control={control}
          label="New password"
          placeholder="Enter new password"
          isPassword
          required
          autoComplete="new-password"
        />
        <RHFInput<ChangePasswordFormValues>
          name="confirmPassword"
          control={control}
          label="Confirm new password"
          placeholder="Re-enter new password"
          isPassword
          required
          autoComplete="new-password"
        />

        <ul className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          <li>• At least 10 characters</li>
          <li>• 3 of: lowercase, uppercase, number, symbol</li>
        </ul>
        <p className="text-xs text-muted-foreground">
          You&apos;ll stay signed in here; other devices will be signed out.
        </p>

        </div>

        <div className="flex justify-end gap-3 border-t border-border bg-background p-4">
          <CustomButton type="button" variant="outline" size="md" onClick={onClose}>
            Cancel
          </CustomButton>
          <CustomButton type="submit" variant="primary" size="md" loading={changeMutation.isPending}>
            Update password
          </CustomButton>
        </div>
      </form>
    </CustomDrawer>
  );
}
