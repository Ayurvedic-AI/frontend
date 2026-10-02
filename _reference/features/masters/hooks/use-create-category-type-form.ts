import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CategoryTypeRow } from '../api/category-types';

const categoryTypeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
});

export type CategoryTypeFormValues = z.infer<typeof categoryTypeSchema>;

const EMPTY: CategoryTypeFormValues = { name: '' };

export function categoryTypeFormDefaults(type?: CategoryTypeRow | null): CategoryTypeFormValues {
  if (!type) return EMPTY;
  return { name: type.name };
}

/** One schema serves create and edit; edit seeds defaults from the row. */
export function useCategoryTypeForm(type?: CategoryTypeRow | null) {
  return useForm<CategoryTypeFormValues>({
    resolver: zodResolver(categoryTypeSchema),
    defaultValues: categoryTypeFormDefaults(type),
    mode: 'onSubmit',
  });
}
