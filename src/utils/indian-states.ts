/**
 * Indian states & union territories (feature 043).
 *
 * Single source of truth for the address "State" dropdown used on every form
 * that captures a state: Doctor, Vendor (both STORE the 2-digit GST state code)
 * and CRM Lead (STORES the state name). The dropdown always SHOWS the name.
 *
 * Ordering: Maharashtra first (the business's primary state), then the rest
 * alphabetical by name — identical on every surface (mirrors the single-source
 * pattern of `./phone.ts`).
 */
import type { AutocompleteOption } from '../common/custom-auto-complete';

export interface IndianState {
  /** Official spelling; CRM Lead stores this, and it is every dropdown label. */
  name: string;
  /** Official 2-digit GST state code (zero-padded); Doctor/Vendor store this. */
  gstCode: string;
  /** Informational only (not shown or filtered on in v1). */
  isUnionTerritory?: boolean;
}

/**
 * 28 states + 8 union territories = 36 entries. Maharashtra is pinned first;
 * every other entry follows in alphabetical order by `name`. GST codes are the
 * current official set (retired codes 25 / old-28 are excluded).
 */
export const INDIAN_STATES: IndianState[] = [
  { name: 'Maharashtra', gstCode: '27' },
  { name: 'Andaman and Nicobar Islands', gstCode: '35', isUnionTerritory: true },
  { name: 'Andhra Pradesh', gstCode: '37' },
  { name: 'Arunachal Pradesh', gstCode: '12' },
  { name: 'Assam', gstCode: '18' },
  { name: 'Bihar', gstCode: '10' },
  { name: 'Chandigarh', gstCode: '04', isUnionTerritory: true },
  { name: 'Chhattisgarh', gstCode: '22' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', gstCode: '26', isUnionTerritory: true },
  { name: 'Delhi', gstCode: '07', isUnionTerritory: true },
  { name: 'Goa', gstCode: '30' },
  { name: 'Gujarat', gstCode: '24' },
  { name: 'Haryana', gstCode: '06' },
  { name: 'Himachal Pradesh', gstCode: '02' },
  { name: 'Jammu and Kashmir', gstCode: '01', isUnionTerritory: true },
  { name: 'Jharkhand', gstCode: '20' },
  { name: 'Karnataka', gstCode: '29' },
  { name: 'Kerala', gstCode: '32' },
  { name: 'Ladakh', gstCode: '38', isUnionTerritory: true },
  { name: 'Lakshadweep', gstCode: '31', isUnionTerritory: true },
  { name: 'Madhya Pradesh', gstCode: '23' },
  { name: 'Manipur', gstCode: '14' },
  { name: 'Meghalaya', gstCode: '17' },
  { name: 'Mizoram', gstCode: '15' },
  { name: 'Nagaland', gstCode: '13' },
  { name: 'Odisha', gstCode: '21' },
  { name: 'Puducherry', gstCode: '34', isUnionTerritory: true },
  { name: 'Punjab', gstCode: '03' },
  { name: 'Rajasthan', gstCode: '08' },
  { name: 'Sikkim', gstCode: '11' },
  { name: 'Tamil Nadu', gstCode: '33' },
  { name: 'Telangana', gstCode: '36' },
  { name: 'Tripura', gstCode: '16' },
  { name: 'Uttar Pradesh', gstCode: '09' },
  { name: 'Uttarakhand', gstCode: '05' },
  { name: 'West Bengal', gstCode: '19' },
];

/** Options for Doctor/Vendor: stores the GST code, displays/searches the name. */
export const STATE_CODE_OPTIONS: AutocompleteOption[] = INDIAN_STATES.map((s) => ({
  key: s.gstCode,
  value: s.name,
}));

/** Options for CRM Lead: stores and displays the state name. */
export const STATE_NAME_OPTIONS: AutocompleteOption[] = INDIAN_STATES.map((s) => ({
  key: s.name,
  value: s.name,
}));

/**
 * Keep a record's existing state value selectable when it isn't in the canonical
 * list (a blank, abbreviation, misspelling, or retired code from before this
 * feature). Prepends a transient `{ key, value }` for that raw value so it stays
 * VISIBLE and is preserved on edit — never silently dropped or rewritten. Returns
 * `options` unchanged when the value is empty or already a known option key.
 */
export function withLegacyOption(
  options: AutocompleteOption[],
  currentValue: string | undefined,
): AutocompleteOption[] {
  const v = (currentValue ?? '').trim();
  if (!v || options.some((o) => o.key === v)) return options;
  return [{ key: v, value: v }, ...options];
}

const _NAME_BY_GST_CODE = new Map(INDIAN_STATES.map((s) => [s.gstCode, s.name]));

/**
 * Display label for a stored State value: a 2-digit GST code (Doctor/Vendor)
 * resolves to its state name; any other value — an already-stored name (CRM Lead)
 * or a legacy/unknown value — is returned unchanged. Used wherever a stored state
 * is shown to a user (e.g. the composed address in tables).
 */
export function stateLabel(value: string | null | undefined): string {
  const v = (value ?? '').trim();
  return _NAME_BY_GST_CODE.get(v) ?? v;
}

const _LOWER_NAMES = new Set(INDIAN_STATES.map((s) => s.name.toLowerCase()));

/**
 * Form validation (#216): a state value is acceptable when it's empty, a known
 * state name (case-insensitive), or a known GST code — the latter so records
 * saved before the named list (which stored codes) still edit cleanly. Free-typed
 * garbage ("abc") is rejected with a message by the calling schema.
 */
export function isKnownState(value: string | null | undefined): boolean {
  const v = (value ?? '').trim();
  if (!v) return true;
  return _LOWER_NAMES.has(v.toLowerCase()) || _NAME_BY_GST_CODE.has(v);
}
