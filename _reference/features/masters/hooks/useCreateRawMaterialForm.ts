import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { RawMaterialRow } from '../api/raw-materials';
import { codeField } from '../../../utils/validation';

// A raw material is MASTER DATA ONLY — name + useful attributes. Stock is never
// entered here; it is received through a GRN. Vendor is optional.
const rawMaterialSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  code: codeField(),
  category_type_id: z.string().optional(),
  unit: z.string().trim().min(1, 'Unit of measure is required').max(30),
  reorder_level: z
    .string()
    .trim()
    .min(1, 'Re-order level is required')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, 'Must be a number ≥ 0'),
});

export type RawMaterialFormValues = z.infer<typeof rawMaterialSchema>;
/** @deprecated kept for compatibility with the create-only era. */
export type CreateRawMaterialFormValues = RawMaterialFormValues;

const EMPTY: RawMaterialFormValues = {
  name: '',
  code: '',
  category_type_id: '',
  unit: '',
  reorder_level: '',
};

export function rawMaterialFormDefaults(material?: RawMaterialRow | null): RawMaterialFormValues {
  if (!material) return EMPTY;
  return {
    ...EMPTY,
    name: material.name,
    code: material.code,
    category_type_id: material.category_type_id != null ? String(material.category_type_id) : '',
    unit: material.unit ?? '',
    reorder_level: material.reorder_level ?? '',
  };
}

/** One schema serves create and edit; edit seeds defaults from the row. */
export function useRawMaterialForm(material?: RawMaterialRow | null) {
  return useForm<RawMaterialFormValues>({
    resolver: zodResolver(rawMaterialSchema),
    defaultValues: rawMaterialFormDefaults(material),
    mode: 'onSubmit',
  });
}
