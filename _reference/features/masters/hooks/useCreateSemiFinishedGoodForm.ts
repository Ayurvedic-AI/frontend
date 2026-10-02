import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { SemiFinishedGoodRow } from '../api/semi-finished-goods';
import { codeField } from '../../../utils/validation';

// A semi-finished good is MASTER DATA ONLY — churna/bharad/bhasma made in-house
// or bought in. Stock is never entered here; it arrives via GRN or conversion.
const semiFinishedGoodSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  code: codeField(),
  sfg_category_id: z.string().optional(),
  unit: z.string().trim().min(1, 'Unit of measure is required').max(30),
  reorder_level: z
    .string()
    .trim()
    .min(1, 'Re-order level is required')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, 'Must be a number ≥ 0'),
  shelf_life_months: z
    .string()
    .trim()
    .min(1, 'Shelf life is required')
    .refine((v) => /^\d+$/.test(v) && Number(v) >= 0, 'Must be a whole number of months ≥ 0'),
});

export type SemiFinishedGoodFormValues = z.infer<typeof semiFinishedGoodSchema>;

const EMPTY: SemiFinishedGoodFormValues = {
  name: '',
  code: '',
  sfg_category_id: '',
  unit: '',
  reorder_level: '',
  shelf_life_months: '',
};

export function semiFinishedGoodFormDefaults(
  sfg?: SemiFinishedGoodRow | null,
): SemiFinishedGoodFormValues {
  if (!sfg) return EMPTY;
  return {
    ...EMPTY,
    name: sfg.name,
    code: sfg.code,
    sfg_category_id: sfg.sfg_category_id != null ? String(sfg.sfg_category_id) : '',
    unit: sfg.unit ?? '',
    reorder_level: sfg.reorder_level ?? '',
    shelf_life_months: sfg.shelf_life_months != null ? String(sfg.shelf_life_months) : '',
  };
}

/** One schema serves create and edit; edit seeds defaults from the row. */
export function useSemiFinishedGoodForm(sfg?: SemiFinishedGoodRow | null) {
  return useForm<SemiFinishedGoodFormValues>({
    resolver: zodResolver(semiFinishedGoodSchema),
    defaultValues: semiFinishedGoodFormDefaults(sfg),
    mode: 'onSubmit',
  });
}
