import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const PASSWORD_BODY_RULE = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?\s]/;

const setNewPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(128, 'Password must not exceed 128 characters')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(PASSWORD_BODY_RULE, 'Password must contain at least one number, symbol, or whitespace'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

export type SetNewPasswordFormValues = z.infer<typeof setNewPasswordSchema>;

export function useSetNewPasswordForm() {
  return useForm<SetNewPasswordFormValues>({
    resolver: zodResolver(setNewPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
    mode: 'onSubmit',
  });
}
