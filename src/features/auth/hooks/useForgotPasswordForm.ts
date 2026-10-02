import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, 'Email ID is required'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function useForgotPasswordForm() {
  return useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onSubmit',
  });
}
