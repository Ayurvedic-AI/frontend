import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Mirrors the backend RoleCreate: name + description required, tier defaults to
// staff. Permissions are NOT set here (feature 023) — a new role is created with
// no grants and permissions are managed from the role page's grid. Bounds match
// the SDK schema (@maxLength 50 / 255).
const createRoleSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50, 'Name must be at most 50 characters'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(255, 'Description must be at most 255 characters'),
  type: z.enum(['admin', 'staff']),
});

export type CreateRoleFormValues = z.infer<typeof createRoleSchema>;

export function useCreateRoleForm() {
  return useForm<CreateRoleFormValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { name: '', description: '', type: 'staff' },
    mode: 'onSubmit',
  });
}
