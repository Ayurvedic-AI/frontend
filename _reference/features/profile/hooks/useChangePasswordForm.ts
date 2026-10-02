import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Character classes the backend policy counts (auth_service.password_policy_violations):
// at least 3 of { lowercase, uppercase, digit, symbol }.
const CLASSES = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/];

// Mirrors the backend ChangePasswordRequest + policy for POST /auth/change-password:
// new_password ≥ 10 chars and ≥ 3 of 4 character classes. `confirmPassword` is
// client-only (not sent). Cross-field rules live in refine()/superRefine().
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(10, 'At least 10 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .superRefine((v, ctx) => {
    const classes = CLASSES.filter((re) => re.test(v.newPassword)).length;
    if (v.newPassword.length >= 10 && classes < 3) {
      ctx.addIssue({
        path: ['newPassword'],
        code: z.ZodIssueCode.custom,
        message: 'Use at least 3 of: lowercase, uppercase, number, symbol',
      });
    }
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match',
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ['newPassword'],
    message: 'New password must differ from current',
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export function useChangePasswordForm() {
  return useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    mode: 'onSubmit',
  });
}
