import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const signInSchema = z.object({
  username: z.string().trim().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
  // `.default(false)` would split input/output types and trip RHF's Control
  // typing; the form's `defaultValues` below provides the same UX.
  rememberMe: z.boolean(),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

export function useSignInForm() {
  return useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
    mode: 'onSubmit',
  });
}
