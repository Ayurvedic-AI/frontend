/**
 * Shared unit-of-measure options (feature 061 list; 070 rework), used by the
 * Raw Material, Purchase Order, GRN and Price List forms so the picker stays
 * consistent everywhere. Values are CAPS 2–3 letter abbreviations covering the
 * legacy price-sheet vocabulary (KG / GM / MG / …).
 */
export const UOM_VALUES = [
  'KG',
  'GM',
  'MG',
  'LTR',
  'ML',
  'PCS',
  'BTL',
  'BOX',
  'PKT',
  'TAB',
  'CAP',
] as const;

export const UOM_ITEMS = UOM_VALUES.map((u) => ({ value: u, label: u }));

/** Legacy/full-word spellings → the canonical abbreviation. */
export const UOM_SYNONYMS: Record<string, string> = {
  kg: 'KG', kgs: 'KG',
  g: 'GM', gm: 'GM', gms: 'GM', gram: 'GM', grams: 'GM',
  mg: 'MG',
  l: 'LTR', ltr: 'LTR', litre: 'LTR', liter: 'LTR',
  ml: 'ML',
  pc: 'PCS', pcs: 'PCS', piece: 'PCS', pieces: 'PCS',
  btl: 'BTL', bottle: 'BTL', bottles: 'BTL',
  box: 'BOX', boxes: 'BOX',
  pkt: 'PKT', packet: 'PKT', packets: 'PKT',
  tab: 'TAB', tabs: 'TAB', tablet: 'TAB', tablets: 'TAB',
  cap: 'CAP', capsule: 'CAP', capsules: 'CAP',
};

/** Canonical abbreviation for any spelling; unknown values pass through. */
export function normalizeUom(value: string): string {
  const trimmed = value.trim();
  if ((UOM_VALUES as readonly string[]).includes(trimmed.toUpperCase())) {
    return trimmed.toUpperCase();
  }
  return UOM_SYNONYMS[trimmed.toLowerCase()] ?? trimmed;
}

/**
 * `UOM_ITEMS` plus a non-standard/legacy value (e.g. a material's stored UOM that
 * predates this list) so it remains selectable instead of silently dropping.
 */
export function uomItemsWith(value?: string | null): { value: string; label: string }[] {
  if (!value || (UOM_VALUES as readonly string[]).includes(value)) return UOM_ITEMS;
  return [...UOM_ITEMS, { value, label: value }];
}

/**
 * Pack SIZES are deliberately NOT listed here: a product's sellable packs come
 * from its Price List (070) — the master vocabulary — so pack pickers (repack /
 * ConversionDrawer) offer those and nothing else. A hardcoded fallback would
 * reintroduce labels the product isn't sold in, which breaks sales matching.
 */

/** Container types for split/pack rows (production completion, GRN, transfer). */
export const PACKAGE_ITEMS = ['BTL', 'PKT', 'BOX', 'PCS'] as const;
/** Measure units a pack size can be expressed in. */
export const PACK_UNIT_ITEMS = ['KG', 'GM', 'MG', 'LTR', 'ML'] as const;

// Numeric conversion factors (mirrors backend `pack_utils.uom_factor`): how many
// family-base units (GM / ML) one unit holds. Units outside these families
// (PCS, BTL, …) are unconvertible.
const MASS_FACTORS: Record<string, number> = { KG: 1000, G: 1, GM: 1, MG: 0.001 };
const VOLUME_FACTORS: Record<string, number> = { LTR: 1000, L: 1000, ML: 1 };

/** `{family, factor}` for a mass/volume UOM; null when unknown/unconvertible. */
export function uomFactor(unit?: string | null): { family: 'mass' | 'volume'; factor: number } | null {
  const key = (unit ?? '').trim().toUpperCase();
  if (key in MASS_FACTORS) return { family: 'mass', factor: MASS_FACTORS[key] };
  if (key in VOLUME_FACTORS) return { family: 'volume', factor: VOLUME_FACTORS[key] };
  return null;
}
