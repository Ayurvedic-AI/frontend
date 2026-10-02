import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Mirrors the editable identity of a role: description always editable; name +
// tier editable for custom roles only (the dialog disables them for built-in
// roles). Permissions are NOT edited here (feature 023) — they are managed from
// the role page's grid via grant/revoke.
const editRoleSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50, 'Name must be at most 50 characters'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(255, 'Description must be at most 255 characters'),
  type: z.enum(['admin', 'staff']),
});

export type EditRoleFormValues = z.infer<typeof editRoleSchema>;

export function useEditRoleForm() {
  return useForm<EditRoleFormValues>({
    resolver: zodResolver(editRoleSchema),
    defaultValues: { name: '', description: '', type: 'staff' },
    mode: 'onSubmit',
  });
}
