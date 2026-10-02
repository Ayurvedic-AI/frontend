import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const enterOtpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export type EnterOtpFormValues = z.infer<typeof enterOtpSchema>;

export function useEnterOtpForm() {
  return useForm<EnterOtpFormValues>({
    resolver: zodResolver(enterOtpSchema),
    defaultValues: { otp: '' },
    mode: 'onSubmit',
  });
}
