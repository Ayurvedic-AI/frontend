import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ProductionFlowItem } from '../../../sdk/schemas';

// A flow = name + a fully free ordered step list (may be empty).
// A step named "RM Issue" deducts the reserved raw material; without one, deduction
// happens at Finished Goods posting. testing_label stays backend-defaulted ("Testing").
export const productionFlowSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  steps: z.array(z.object({ label: z.string().trim().min(1, 'Step name is required').max(100) })).max(20),
});

export type ProductionFlowFormValues = z.infer<typeof productionFlowSchema>;

export const emptyFlowStep = (): ProductionFlowFormValues['steps'][number] => ({ label: '' });

/** Fixed first step of every flow — completing it deducts the reserved raw material. */
export const RM_STEP_LABEL = 'RAW MATERIAL PICKED';

// Mirrors the backend's RM_ISSUE synonym set (production_pipeline_service._step_key).
const RM_STEP_KEYS = new Set([
  'RM', 'RM_ISSUE', 'RM_ISSUED', 'RM_PICK', 'RM_PICKED',
  'RAW_MATERIAL', 'RAW_MATERIALS', 'RAW_MATERIAL_ISSUE', 'RAW_MATERIAL_ISSUED',
  'RAW_MATERIAL_PICK', 'RAW_MATERIAL_PICKED',
]);

export function isRmStepLabel(label: string): boolean {
  const key = label.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return RM_STEP_KEYS.has(key);
}

export function productionFlowFormDefaults(flow?: ProductionFlowItem | null): ProductionFlowFormValues {
  if (!flow) return { name: '', steps: [{ label: RM_STEP_LABEL }] };
  const steps = flow.steps.map((s) => ({ label: s.label }));
  // Every flow keeps a locked raw-material first step; prepend it for legacy
  // flows saved without one (unless an RM step already sits elsewhere).
  if (!steps.some((s) => isRmStepLabel(s.label))) steps.unshift({ label: RM_STEP_LABEL });
  return { name: flow.name, steps };
}

export function useProductionFlowForm(flow?: ProductionFlowItem | null) {
  return useForm<ProductionFlowFormValues>({
    resolver: zodResolver(productionFlowSchema),
    defaultValues: productionFlowFormDefaults(flow),
    mode: 'onSubmit',
  });
}
