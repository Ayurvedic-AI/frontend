import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { phoneOptional } from '../../../utils/validation';

// Mirrors the backend AdminUserUpdate (feature 008) — a partial update; the
// form sends the current values for every field.
const editUserSchema = z.object({
  email: z.string().trim().min(3, 'Email is required').email('Enter a valid email'),
  first_name: z.string().trim().min(1, 'First name is required').max(100),
  last_name: z.string().trim().min(1, 'Last name is required').max(100),
  phone: phoneOptional(),
  role: z.string().min(1, 'Role is required'),
});

export type EditUserFormValues = z.infer<typeof editUserSchema>;

export function useEditUserForm() {
  return useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { email: '', first_name: '', last_name: '', phone: '', role: 'user' },
    mode: 'onSubmit',
  });
}
