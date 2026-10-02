import { useNavigate } from 'react-router-dom';
import { CustomLabel } from '../../../common/custom-label';
import { CustomButton } from '../../../common/custom-buttons';
import { RHFInput } from '../../../common/rhf-wrappers';
import { useToast } from '../../../common/common-snackbar';
import { useFormApiErrors } from '../../../hooks/useFormApiErrors';
import { AuthLayout } from '../components/AuthLayout';
import { useAuthForgotPassword } from '../api/auth-stubs';
import { useForgotPasswordForm, type ForgotPasswordFormValues } from '../hooks/useForgotPasswordForm';
import { storeOtpExpiry } from '../hooks/useOtpTimer';

// Backend OTPs are valid for 10 minutes (FR-017) — used by the inline timer on
// the next page. Server doesn't echo this back; we just match the contract.
const OTP_EXPIRY_SECONDS = 10 * 60;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { control, handleSubmit, getValues, setError } = useForgotPasswordForm();
  const { handleApiError } = useFormApiErrors(setError);

  const forgotPasswordMutation = useAuthForgotPassword({
    mutation: {
      onSuccess: () => {
        // FR-018: response is the same uniform 202 whether or not the email
        // matched. We don't surface "email found"/"email not found" in the
        // UI — just proceed to the OTP entry page. The OTP only arrives in
        // the inbox if the email was registered.
        storeOtpExpiry(OTP_EXPIRY_SECONDS);
        toast({
          severity: 'success',
          message: 'If that account exists, a code has been sent.',
        });
        setTimeout(
          () => navigate('/enter-otp', { state: { email: getValues('email') } }),
          500,
        );
      },
      onError: (error) => {
        const general = handleApiError(error);
        if (general) toast({ severity: 'error', message: general });
      },
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    forgotPasswordMutation.mutate({ data: { email: data.email } });
  };

  return (
    <AuthLayout>
      <h1 className="mb-1 text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">
        Forgot Your Password
      </h1>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        Enter your registered email to receive an OTP.
      </p>

      <div className="mb-6">
        <CustomLabel htmlFor="email" isRequired label="Email" />
        <RHFInput<ForgotPasswordFormValues>
          name="email"
          control={control}
          placeholder="Enter Email ID"
          isEmail
        />
      </div>

      <CustomButton
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        loading={forgotPasswordMutation.isPending}
        onClick={handleSubmit(onSubmit)}
      >
        Send OTP
      </CustomButton>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
