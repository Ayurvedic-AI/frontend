import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomButton } from '../../../common/custom-buttons';
import { RHFInput, RHFCheckbox } from '../../../common/rhf-wrappers';
import { useToast } from '../../../common/common-snackbar';
import { useFormApiErrors } from '../../../hooks/useFormApiErrors';
import { AuthLayout } from '../components/AuthLayout';
import { useAuthLogin } from '../api/auth-stubs';
import type { LoginUserOut } from '../api/auth-stubs';
import { useSignInForm, type SignInFormValues } from '../hooks/useSignInForm';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../../../api/client';

export function SignInPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const { control, handleSubmit, setError } = useSignInForm();
  const { handleApiError } = useFormApiErrors(setError);
  const [pending, setPending] = useState(false);

  const loginMutation = useAuthLogin({
    mutation: {
      onSuccess: (response) => {
        // The generated mutator wraps responses as {data, status, headers}.
        // For a 200 response, `response.data` is the LoginResponse body.
        // Server has already set __Host-access / __Host-refresh / csrf_token
        // cookies; we just prime the in-memory user. The login body carries the
        // effective `permissions` (feature 039) so the prime is complete — gating
        // works immediately without waiting for a /auth/me round-trip.
        const loginBody = (response as { data: { user: LoginUserOut } }).data;
        signIn({ ...loginBody.user, is_active: true });
        toast({ severity: 'success', message: 'Welcome back!' });
        // Route through "/" so landing resolution picks the first page this user
        // can actually view (or the no-access screen) — they may lack dashboard.
        setTimeout(() => navigate('/'), 300);
      },
      onError: (error) => {
        // Backend returns a uniform 401 `{detail: "Invalid credentials"}` for
        // unknown email + wrong password + deactivated — it can't say which field
        // is wrong, so surface a single message via the snackbar (no inline field error).
        if (error instanceof ApiError && error.status === 401) {
          toast({ severity: 'error', message: 'Invalid email or password.' });
          return;
        }
        const general = handleApiError(error);
        if (general) toast({ severity: 'error', message: general });
      },
      onSettled: () => setPending(false),
    },
  });

  const onSubmit = (data: SignInFormValues) => {
    setPending(true);
    loginMutation.mutate({
      data: { username: data.username, password: data.password },
    });
  };

  return (
    <AuthLayout>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <h1 className="mb-1 text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">
          Welcome back
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          Sign in with the credentials provided by your clinic.
        </p>

        <div className="mb-4">
          <RHFInput<SignInFormValues>
            name="username"
            control={control}
            label="Email"
            required
            placeholder="Enter email"
          />
        </div>

        <div className="mb-3">
          <RHFInput<SignInFormValues>
            name="password"
            control={control}
            label="Password"
            required
            placeholder="Enter password"
            isPassword
          />
        </div>

        <div className="mb-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <RHFCheckbox<SignInFormValues>
            name="rememberMe"
            control={control}
            label="Remember Me"
            size="sm"
          />
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        <CustomButton
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={pending || loginMutation.isPending}
        >
          Sign in
        </CustomButton>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          One login for Admin · Vaidya · Staff
        </p>
      </form>
    </AuthLayout>
  );
}

export default SignInPage;
