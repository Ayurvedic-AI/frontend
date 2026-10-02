import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { phoneOptional } from '../../../utils/validation';

// Mirrors the backend AdminUserCreate (feature 008): email + role required,
// name/phone optional.
const createUserSchema = z.object({
  email: z.string().trim().min(3, 'Email is required').email('Enter a valid email'),
  first_name: z.string().trim().min(1, 'First name is required').max(100),
  last_name: z.string().trim().min(1, 'Last name is required').max(100),
  phone: phoneOptional(),
  role: z.string().min(1, 'Role is required'),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export function useCreateUserForm() {
  return useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    // role starts empty so the "Select role" placeholder shows and the required
    // rule forces a choice. ('user' is filtered out of the dropdown anyway.)
    defaultValues: { email: '', first_name: '', last_name: '', phone: '', role: '' },
    mode: 'onSubmit',
  });
}
