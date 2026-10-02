import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ProductCategoryRow } from '../api/product-categories';

const productCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
});

export type ProductCategoryFormValues = z.infer<typeof productCategorySchema>;

const EMPTY: ProductCategoryFormValues = { name: '' };

export function productCategoryFormDefaults(category?: ProductCategoryRow | null): ProductCategoryFormValues {
  if (!category) return EMPTY;
  return { name: category.name };
}

/** One schema serves create and edit; edit seeds defaults from the row. */
export function useProductCategoryForm(category?: ProductCategoryRow | null) {
  return useForm<ProductCategoryFormValues>({
    resolver: zodResolver(productCategorySchema),
    defaultValues: productCategoryFormDefaults(category),
    mode: 'onSubmit',
  });
}
