import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const roleSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50),
  type: z.enum(['admin', 'staff']),
  description: z.string().trim().min(1, 'Description is required').max(200),
});

export type RoleFormValues = z.infer<typeof roleSchema>;

export function useRoleForm() {
  return useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: '', type: 'staff', description: '' },
    mode: 'onSubmit',
  });
}
