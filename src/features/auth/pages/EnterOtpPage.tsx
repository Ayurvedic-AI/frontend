import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../../lib/cn';
import { CustomButton } from '../../../common/custom-buttons';
import { useToast } from '../../../common/common-snackbar';
import { useFormApiErrors } from '../../../hooks/useFormApiErrors';
import { AuthLayout } from '../components/AuthLayout';
import { OtpInput } from '../components/OtpInput';
import { useAuthForgotPassword, useAuthVerifyOtp } from '../api/auth-stubs';
import { useEnterOtpForm, type EnterOtpFormValues } from '../hooks/useEnterOtpForm';
import { clearOtpExpiry, useOtpTimer } from '../hooks/useOtpTimer';

const OTP_EXPIRY_SECONDS = 10 * 60;

export function EnterOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || '';
  const { toast } = useToast();
  const { setValue, handleSubmit, setError } = useEnterOtpForm();
  const { handleApiError } = useFormApiErrors(setError);
  const { isExpired, display, resetTimer } = useOtpTimer();

  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const startCooldown = () => {
    setResendCooldown(30);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const isOtpComplete = otpDigits.every((d) => d !== '');

  const handleOtpChange = (digits: string[]) => {
    setOtpDigits(digits);
    setValue('otp', digits.join(''), { shouldValidate: true });
  };

  const verifyOtpMutation = useAuthVerifyOtp({
    mutation: {
      onSuccess: (response) => {
        // The backend returns { reset_token } in the success body. The mutator
        // wraps it as { data, status, headers }; we extract reset_token here
        // and pass it through `location.state` so it's never stored in
        // localStorage / sessionStorage (per the spec's threat model).
        const resetToken = (response as { data: { reset_token: string } }).data
          .reset_token;
        clearOtpExpiry();
        toast({ severity: 'success', message: 'OTP verified.' });
        setTimeout(
          () =>
            navigate('/set-password', {
              state: { email, token: resetToken },
            }),
          400,
        );
      },
      onError: (error) => {
        // FR-046: the backend returns a single uniform 400 for any failure
        // branch (expired / locked / wrong / unknown email). Don't try to
        // surface "wrong code" vs "expired" — they're indistinguishable to
        // the client by design.
        const general = handleApiError(error);
        toast({
          severity: 'error',
          message: general || 'This code is no longer valid. Please request a new one.',
        });
      },
    },
  });

  const resendOtpMutation = useAuthForgotPassword({
    mutation: {
      onSuccess: () => {
        resetTimer(OTP_EXPIRY_SECONDS);
        toast({
          severity: 'success',
          message: 'If that account exists, a new code has been sent.',
        });
        startCooldown();
      },
      onError: (error) => {
        const general = handleApiError(error);
        if (general) toast({ severity: 'error', message: general });
      },
    },
  });

  const onSubmit = (data: EnterOtpFormValues) => {
    verifyOtpMutation.mutate({ data: { email, otp: data.otp } });
  };

  const handleResendOtp = () => {
    if (resendOtpMutation.isPending || !isExpired || resendCooldown > 0) return;
    resendOtpMutation.mutate({ data: { email } });
  };

  return (
    <AuthLayout>
      <h1 className="mb-1 text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">
        Enter OTP
      </h1>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground sm:mb-8">
        We've sent a 6-digit verification code to your registered email.
      </p>

      <div className="mb-6">
        <OtpInput value={otpDigits} onChange={handleOtpChange} />
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-center gap-1 text-sm">
        {isExpired ? (
          <>
            <span className="text-muted-foreground">Didn't receive the code?</span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendOtpMutation.isPending || resendCooldown > 0}
              className={cn(
                'font-semibold text-foreground',
                resendOtpMutation.isPending || resendCooldown > 0
                  ? 'cursor-default opacity-60'
                  : 'cursor-pointer hover:underline',
              )}
            >
              Resend OTP
            </button>
          </>
        ) : (
          <span className="text-muted-foreground">
            Resend OTP in <span className="font-semibold text-foreground">{display}</span>
          </span>
        )}
      </div>

      <CustomButton
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        loading={verifyOtpMutation.isPending}
        disabled={!isOtpComplete}
        onClick={handleSubmit(onSubmit)}
      >
        Verify &amp; Continue
      </CustomButton>
    </AuthLayout>
  );
}

export default EnterOtpPage;
