import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { StoreTypeRow } from '../api/store-types';

const storeTypeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
});

export type StoreTypeFormValues = z.infer<typeof storeTypeSchema>;

const EMPTY: StoreTypeFormValues = { name: '' };

export function storeTypeFormDefaults(type?: StoreTypeRow | null): StoreTypeFormValues {
  if (!type) return EMPTY;
  return { name: type.name };
}

/** One schema serves create and edit; edit seeds defaults from the row. */
export function useStoreTypeForm(type?: StoreTypeRow | null) {
  return useForm<StoreTypeFormValues>({
    resolver: zodResolver(storeTypeSchema),
    defaultValues: storeTypeFormDefaults(type),
    mode: 'onSubmit',
  });
}
