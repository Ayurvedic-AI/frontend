import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { BomRow } from '../api/boms';

/** Stock-linked recipe line (Sections A & B). `item_type` narrows the picker
 * (raw / semi-finished / finished); the picked key still carries the id space
 * (`rm:<id>` / `mat:<id>`) in raw_material_id. */
const materialLineSchema = z.object({
  item_type: z.enum(['rm', 'sf', 'fg']),
  raw_material_id: z.string().min(1, 'Material is required'),
  quantity: z.string().trim().min(1, 'Quantity is required').max(100),
});

/** Free-text ingredient NOT tracked in stock (e.g. juice) — name + qty + unit. */
const ingredientLineSchema = z.object({
  ingredient_name: z.string().trim().min(1, 'Ingredient is required').max(300),
  quantity: z.string().trim().min(1, 'Quantity is required').max(100),
  unit: z.string().trim().min(1, 'Unit is required').max(30),
});

const bomSchema = z
  .object({
    // What the recipe produces: a finished product or a semi-finished good.
    output_kind: z.enum(['product', 'sfg']),
    product_id: z.string(),
    sfg_id: z.string(),
    // Feature 072 (dynamic flows): the Production Flows master code.
    flow_type: z.string().min(1, 'Please select a production flow'),
    // Default batch size when a BOM order leaves Batch Size blank (backend
    // falls back to bom.output_qty). Optional.
    output_qty: z.string().trim().max(20),
    // Section A — stock materials, qty SCALES with batch size (qty × batch).
    lines_a: z.array(materialLineSchema),
    // Section B — stock materials, FIXED qty per batch run (no scaling).
    lines_b: z.array(materialLineSchema),
    // Other ingredients (not in stock) — scaled / fixed, display-only.
    ing_scaled: z.array(ingredientLineSchema),
    ing_fixed: z.array(ingredientLineSchema),
  })
  .superRefine((v, ctx) => {
    if (v.output_kind === 'product' && !v.product_id) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['product_id'], message: 'Product is required' });
    }
    if (v.output_kind === 'sfg' && !v.sfg_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sfg_id'],
        message: 'Semi-finished good is required',
      });
    }
    if (v.output_qty && !(Number(v.output_qty) > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['output_qty'],
        message: 'Enter a number greater than 0',
      });
    }
    const total = v.lines_a.length + v.lines_b.length + v.ing_scaled.length + v.ing_fixed.length;
    if (total === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lines_a'],
        message: 'Add at least one line',
      });
    }
    // A material can appear on the recipe only once ACROSS Sections A + B
    // (#218) — a duplicate would double-reserve the ingredient.
    const seen = new Set<string>();
    (['lines_a', 'lines_b'] as const).forEach((key) => {
      v[key].forEach((line, i) => {
        if (!line.raw_material_id) return;
        if (seen.has(line.raw_material_id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key, i, 'raw_material_id'],
            message: 'This material is already on the template — adjust its quantity instead',
          });
        }
        seen.add(line.raw_material_id);
      });
    });
  });

export type BomMaterialLineValues = z.infer<typeof materialLineSchema>;
export type BomIngredientLineValues = z.infer<typeof ingredientLineSchema>;
export type BomFormValues = z.infer<typeof bomSchema>;

export function emptyBomLine(): BomMaterialLineValues {
  return { item_type: 'rm', raw_material_id: '', quantity: '' };
}

export function emptyIngredientLine(): BomIngredientLineValues {
  return { ingredient_name: '', quantity: '', unit: '' };
}

export function bomFormDefaults(bom?: BomRow | null): BomFormValues {
  if (!bom) {
    return {
      output_kind: 'product',
      product_id: '',
      sfg_id: '',
      flow_type: 'GENERIC',
      output_qty: '',
      lines_a: [emptyBomLine()],
      lines_b: [],
      ing_scaled: [],
      ing_fixed: [],
    };
  }
  const lines_a: BomMaterialLineValues[] = [];
  const lines_b: BomMaterialLineValues[] = [];
  const ing_scaled: BomIngredientLineValues[] = [];
  const ing_fixed: BomIngredientLineValues[] = [];
  for (const line of bom.lines ?? []) {
    if (line.section === 'SECTION_HEADER') continue;
    // The picker key carries which id space the component came from — a raw
    // material or an inventory material (semi-finished / finished good).
    if (line.raw_material_id != null || line.material_id != null) {
      const target = line.section === 'FIXED_MATERIAL' ? lines_b : lines_a;
      const key =
        line.material_id != null ? `mat:${line.material_id}` : `rm:${line.raw_material_id}`;
      const item_type =
        line.material_id != null ? (line.material_kind === 'fg' ? 'fg' : 'sf') : 'rm';
      target.push({ item_type, raw_material_id: key, quantity: line.quantity ?? '' });
    } else if (line.ingredient_name) {
      // Legacy free-text sections (BHAVANA / EXCIPIENT) land in the FIXED block.
      const target = line.section === 'INGREDIENT_SCALED' ? ing_scaled : ing_fixed;
      target.push({
        ingredient_name: line.ingredient_name,
        quantity: line.quantity ?? '',
        unit: line.unit ?? '',
      });
    }
  }
  return {
    // A product link wins the Type: a template carrying BOTH outputs is a
    // product BOM whose bulk happens to be a semi-finished good, so its SFG
    // seeds the bulk picker rather than flipping the whole template to 'sfg'.
    output_kind: bom.product_id == null && bom.semi_finished_good_id != null ? 'sfg' : 'product',
    product_id: bom.product_id != null ? String(bom.product_id) : '',
    sfg_id:
      bom.product_id == null && bom.semi_finished_good_id != null
        ? String(bom.semi_finished_good_id)
        : '',
    flow_type: bom.flow_type ?? 'GENERIC',
    output_qty: bom.output_qty != null ? String(bom.output_qty) : '',
    lines_a: lines_a.length || lines_b.length || ing_scaled.length || ing_fixed.length ? lines_a : [emptyBomLine()],
    lines_b,
    ing_scaled,
    ing_fixed,
  };
}

export function useBomForm(bom?: BomRow | null) {
  return useForm<BomFormValues>({
    resolver: zodResolver(bomSchema),
    defaultValues: bomFormDefaults(bom),
    mode: 'onSubmit',
  });
}
