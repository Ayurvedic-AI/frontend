import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { BomOrderRow } from '../api/bom-orders';

export const bomOrderSchema = z
  .object({
    bom_id: z.string().min(1, 'Please select a BOM template'),
    batch_no: z.string().trim().min(1, 'Batch number is required').max(100),
    batch_size: z
      .string()
      .trim()
      .min(1, 'Batch size is required')
      .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Must be a number > 0'),
    mfg_date: z.string().optional(),
    exp_date: z.string().optional(),
  })
  // Cross-field date sanity (#236): expiry must follow manufacture.
  // Started/Completed are SYSTEM lifecycle stamps (production pipeline), not inputs.
  .superRefine((v, ctx) => {
    if (v.mfg_date && v.exp_date && new Date(v.exp_date) <= new Date(v.mfg_date)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['exp_date'], message: 'Exp date must be after the Mfg date' });
    }
  });

export type BomOrderFormValues = z.infer<typeof bomOrderSchema>;

/** Fresh create defaults: Mfg = today, Exp = today + 5 years (both editable). */
function emptyBomOrderForm(): BomOrderFormValues {
  return {
    bom_id: '',
    batch_no: '',
    batch_size: '',
    // Blank until a template is picked — the drawer then prefills mfg = today
    // and exp = today + the output good's shelf life (months) from its master.
    mfg_date: '',
    exp_date: '',
  };
}

export function bomOrderFormDefaults(order?: BomOrderRow | null): BomOrderFormValues {
  if (!order) return emptyBomOrderForm();
  return {
    bom_id: String(order.bom_id),
    batch_no: order.batch_no,
    batch_size: order.batch_size != null ? String(order.batch_size) : '',
    mfg_date: order.mfg_date ?? '',
    exp_date: order.exp_date ?? '',
  };
}

export function useBomOrderForm(order?: BomOrderRow | null) {
  return useForm<BomOrderFormValues>({
    resolver: zodResolver(bomOrderSchema),
    defaultValues: bomOrderFormDefaults(order),
    mode: 'onSubmit',
  });
}
