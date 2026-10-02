import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { phoneOptional } from '../../../utils/validation';

// Mirrors the backend UpdateProfileRequest (feature 006): a partial update of
// the signed-in user's own profile. Email and role are NOT part of this schema
// — the backend uses `extra="forbid"`, so only these three fields are sent.
// Names are required; an empty (trimmed) phone clears it (null → "Not set").
export const editProfileSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(100, 'Max 100 characters'),
  last_name: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(100, 'Max 100 characters'),
  phone: phoneOptional(),
});

export type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export function useEditProfileForm() {
  return useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { first_name: '', last_name: '', phone: '' },
    mode: 'onSubmit',
  });
}
