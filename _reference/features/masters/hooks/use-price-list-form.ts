/** Price List drawer form (feature 070): ONE zod schema for create + edit.
 * A price list belongs to a finished good (product) OR a raw material —
 * `kind` drives which category list + item picker the drawer shows and which
 * save endpoint is called. Entries are dynamic rows of [quantity? | unit |
 * price] — the unit comes from the shared UOM dropdown so pack labels stay
 * consistent with the rest of the app (and link cleanly to sales-order
 * packs). The stored pack label is composed as "<qty> <unit>" (e.g.
 * "500 gram"), or just the unit/variant when no quantity applies (e.g.
 * "Akhand"). Duplicate composed labels are rejected case-insensitively on the
 * offending row (Principle III). */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { normalizeUom } from '../../../utils/uom';
import type { PriceListRow } from '../api/price-list';

const entrySchema = z.object({
  // Optional pack quantity (e.g. 500 for "500 gram"); blank = unit-only pack.
  qty: z
    .string()
    .trim()
    .refine((v) => v === '' || (!Number.isNaN(Number(v)) && Number(v) > 0), 'Enter a number above 0'),
  unit: z.string().trim().min(1, 'Unit is required').max(40),
  price: z
    .string()
    .trim()
    .min(1, 'Price is required')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, 'Enter a price above 0'),
});

export type PriceEntryFormValues = z.infer<typeof entrySchema>;

/** "<qty> <unit>" or just "<unit>" — the persisted pack label. */
export function composePackLabel(e: { qty: string; unit: string }): string {
  const qty = e.qty.trim();
  const unit = e.unit.trim();
  return qty ? `${qty} ${unit}` : unit;
}

/** Split a stored pack label back into qty + unit for editing. Legacy unit
 * spellings ("gram") normalize to the canonical abbreviation ("GM") so a
 * re-save converges old data onto the shared vocabulary. */
export function parsePackLabel(label: string): { qty: string; unit: string } {
  const m = /^(\d+(?:\.\d+)?)\s+(.+)$/.exec(label.trim());
  if (m) return { qty: m[1], unit: normalizeUom(m[2]) };
  return { qty: '', unit: label.trim() };
}

const priceListSchema = z
  .object({
    // Finished good vs raw material — drives the item picker + endpoint.
    kind: z.enum(['product', 'raw_material']),
    // Selected product/raw-material id (string from the autocomplete).
    item_id: z.string().min(1, 'Select a product or raw material'),
    entries: z.array(entrySchema).min(1, 'Add at least one pack price'),
  })
  .superRefine((val, ctx) => {
    const seen = new Set<string>();
    val.entries.forEach((e, i) => {
      const key = composePackLabel(e).toLowerCase();
      if (!key.trim()) return;
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['entries', i, 'unit'],
          message: 'Duplicate pack',
        });
      } else {
        seen.add(key);
      }
    });
  });

export type PriceListFormValues = z.infer<typeof priceListSchema>;

export const EMPTY_ENTRY: PriceEntryFormValues = { qty: '', unit: '', price: '' };

export function priceListFormDefaults(row?: PriceListRow | null): PriceListFormValues {
  if (!row) return { kind: 'product', item_id: '', entries: [{ ...EMPTY_ENTRY }] };
  const isRm = row.item_kind === 'raw_material';
  return {
    kind: isRm ? 'raw_material' : 'product',
    item_id: String((isRm ? row.raw_material_id : row.product_id) ?? ''),
    entries: row.entries.map((e) => ({ ...parsePackLabel(e.pack_label), price: String(e.price) })),
  };
}

/** One schema serves create and edit; edit seeds defaults from the row. */
export function usePriceListForm(row?: PriceListRow | null) {
  return useForm<PriceListFormValues>({
    resolver: zodResolver(priceListSchema),
    defaultValues: priceListFormDefaults(row),
    mode: 'onSubmit',
  });
}
