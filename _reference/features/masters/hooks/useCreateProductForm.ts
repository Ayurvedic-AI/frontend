import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ProductRow } from '../api/products';
import { hsnOptional } from '../../../utils/validation';

// SKU is OPTIONAL (feature 048): blank → the backend auto-generates a unique
// code. When present it follows the same uppercase code rules.
const skuOptional = z
  .string()
  .trim()
  .max(50)
  .refine(
    (v) => v === '' || /^[A-Z0-9][A-Z0-9_-]*$/.test(v),
    'Use uppercase letters, numbers, - or _ (no spaces)',
  );
// Shelf life — whole, non-negative months (free text, validated + converted).
const months = z
  .string()
  .trim()
  .min(1, 'Shelf life is required')
  .refine((v) => /^\d+$/.test(v), 'Enter whole months (0 or more)');

const productSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  code: skuOptional,
  // Free-text classification (feature 048): Satva, Ghrita, …
  category: z.string().trim().max(100),
  hsn: hsnOptional(),
  // Pack size stays free-form text; surfaced as "Unit" in the UI — required.
  pack_size: z.string().trim().min(1, 'Unit is required').max(60),
  shelf_life_months: months,
  // Low-stock threshold (feature 065): required, non-negative.
  reorder_level: z
    .string()
    .trim()
    .min(1, 'Re-order level is required')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, 'Enter a valid amount'),
});

export type ProductFormValues = z.infer<typeof productSchema>;
/** @deprecated kept for compatibility with the create-only era. */
export type CreateProductFormValues = ProductFormValues;

const EMPTY: ProductFormValues = {
  name: '',
  code: '',
  category: '',
  hsn: '',
  pack_size: '',
  shelf_life_months: '',
  reorder_level: '',
};

export function productFormDefaults(product?: ProductRow | null): ProductFormValues {
  if (!product) return EMPTY;
  return {
    name: product.name,
    code: product.code,
    category: product.category ?? '',
    hsn: product.hsn ?? '',
    pack_size: product.pack_size ?? '',
    shelf_life_months: product.shelf_life_months != null ? String(product.shelf_life_months) : '',
    reorder_level: product.reorder_level != null ? String(product.reorder_level) : '',
  };
}

/** One schema serves create and edit; edit seeds defaults from the row. */
export function useProductForm(product?: ProductRow | null) {
  return useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: productFormDefaults(product),
    mode: 'onSubmit',
  });
}

/** @deprecated use `useProductForm` (create+edit). */
export const useCreateProductForm = useProductForm;
