import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CustomLabel } from '../../../common/custom-label';
import { CustomButton } from '../../../common/custom-buttons';
import { RHFInput } from '../../../common/rhf-wrappers';
import { useToast } from '../../../common/common-snackbar';
import { useFormApiErrors } from '../../../hooks/useFormApiErrors';
import { AuthLayout } from '../components/AuthLayout';
import {
  useAuthResetPassword,
  useAuthAcceptInvitation,
  useAuthLogout,
} from '../api/auth-stubs';
import {
  useSetNewPasswordForm,
  type SetNewPasswordFormValues,
} from '../hooks/useSetNewPasswordForm';
import { useAuth } from '../hooks/useAuth';

// Mirrors backend FR-024 so users see the requirements client-side.
const PASSWORD_REQUIREMENTS = [
  'At least 10 characters long',
  'At least three of: lowercase, uppercase, digit, symbol',
];

export function SetNewPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { signOut } = useAuth();

  // Two flows land on this page; the token's *source* tells us which:
  //   - `location.state.token`  → reset-password flow (came from OTP verify)
  //   - `?token=…` query param  → invitation flow (came from email link)
  // The two endpoints accept different request shapes and live on different
  // routes; we pick the right mutation based on which source supplied it.
  const stateToken = (location.state as { token?: string })?.token;
  const urlToken = searchParams.get('token');
  const token = stateToken || urlToken || '';
  const flow: 'reset' | 'invitation' = stateToken ? 'reset' : 'invitation';

  const { toast } = useToast();
  const { control, handleSubmit, setError } = useSetNewPasswordForm();
  const { handleApiError } = useFormApiErrors(setError);

  // Both endpoints set the same auth cookies as /auth/login, signing the user in.
  // We don't want that automatic login (either flow) — so after the password is
  // set we clear that fresh server session and send the user to the login page to
  // sign in explicitly. Runs on success OR error so a failed logout still can't
  // strand the user in a half-signed-in state — signOut() clears the client cache
  // either way.
  const logoutMutation = useAuthLogout({
    mutation: {
      onSuccess: () => {
        signOut();
        navigate('/login', { replace: true });
      },
      onError: () => {
        signOut();
        navigate('/login', { replace: true });
      },
    },
  });

  const successHandler = (message: string) => {
    toast({ severity: 'success', message });
    logoutMutation.mutate();
  };

  const errorHandler = (error: unknown) => {
    const general = handleApiError(error);
    if (general) toast({ severity: 'error', message: general });
  };

  const resetPasswordMutation = useAuthResetPassword({
    mutation: {
      onSuccess: () =>
        successHandler('Password updated. Please sign in with your new password.'),
      onError: errorHandler,
    },
  });

  const acceptInvitationMutation = useAuthAcceptInvitation({
    mutation: {
      onSuccess: () =>
        successHandler('Your account is ready. Please sign in to continue.'),
      onError: errorHandler,
    },
  });

  const isPending =
    resetPasswordMutation.isPending ||
    acceptInvitationMutation.isPending ||
    logoutMutation.isPending;

  const onSubmit = (data: SetNewPasswordFormValues) => {
    if (!token) {
      toast({
        severity: 'error',
        message: 'Invalid session. Please restart the password reset process.',
      });
      return;
    }
    if (flow === 'invitation') {
      acceptInvitationMutation.mutate({
        data: { invitation_token: token, new_password: data.newPassword },
      });
    } else {
      resetPasswordMutation.mutate({
        data: { reset_token: token, new_password: data.newPassword },
      });
    }
  };

  return (
    <AuthLayout>
      <h1 className="mb-1 text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">
        {flow === 'invitation' ? 'Welcome — Set Your Password' : 'Set Your New Password'}
      </h1>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        {flow === 'invitation'
          ? "You've been invited. Pick a strong password to activate your account."
          : 'Create a strong password to secure your account.'}
      </p>

      <div className="mb-4">
        <CustomLabel htmlFor="newPassword" isRequired label="New Password" />
        <RHFInput<SetNewPasswordFormValues>
          name="newPassword"
          control={control}
          placeholder="Enter New Password"
          isPassword
        />
      </div>

      <div className="mb-6">
        <CustomLabel htmlFor="confirmPassword" isRequired label="Confirm Password" />
        <RHFInput<SetNewPasswordFormValues>
          name="confirmPassword"
          control={control}
          placeholder="Confirm New Password"
          isPassword
        />
      </div>

      <CustomButton
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        loading={isPending}
        onClick={handleSubmit(onSubmit)}
      >
        Set Password
      </CustomButton>

      <div className="mt-4">
        <p className="mb-1 text-xs font-semibold text-muted-foreground">Password Requirements:</p>
        <ul className="list-disc pl-5 text-xs leading-relaxed text-muted-foreground">
          {PASSWORD_REQUIREMENTS.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>
    </AuthLayout>
  );
}

export default SetNewPasswordPage;
