import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { stateLabel } from './indian-states';

dayjs.extend(relativeTime);

const EMPTY = '—';

/** Date as "DD MMM YYYY" (em-dash when empty). */
export function formatDate(value: string | Date | null | undefined): string {
  return value ? dayjs(value).format('DD MMM YYYY') : EMPTY;
}

/** Date + time as "DD MMM YYYY, h:mm A" (em-dash when empty). */
export function formatDateTime(value: string | Date | null | undefined): string {
  return value ? dayjs(value).format('DD MMM YYYY, h:mm A') : EMPTY;
}

/** Relative time like "2 hours ago" (em-dash when empty). */
export function formatRelativeTime(value: string | Date | null | undefined): string {
  return value ? dayjs(value).fromNow() : EMPTY;
}

/** Joined first/last name (em-dash when both empty). */
export function fullName(
  first: string | null | undefined,
  last: string | null | undefined,
): string {
  const name = [first, last].filter(Boolean).join(' ').trim();
  return name || EMPTY;
}

/** INR currency as "₹1234.00" (em-dash when null/undefined). */
export function formatCurrency(value: number | null | undefined): string {
  return value == null ? EMPTY : `₹${value.toFixed(2)}`;
}

/** Stock quantity with exactly 2 decimals, e.g. "120.00" (em-dash when null/blank/non-numeric). */
export function formatQty(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return EMPTY;
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : EMPTY;
}

/** Pretty-printed JSON for previews (null when the value is null/undefined). */
export function prettyJson(value: unknown): string | null {
  if (value == null) return null;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/** The parts of a structured postal address (feature 045). */
export interface AddressParts {
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state_code?: string | null;
  zip_code?: string | null;
  /** Legacy single free-text address (Dispatch Checklist) used as a fallback. */
  address?: string | null;
}

/**
 * Compose a full address for table cells: the populated parts in reading order
 * (line 1, line 2, city, state, zip), joined by ", ", omitting empty parts so
 * there are no stray separators (spec FR-005 / SC-003). Falls back to the legacy
 * free-text `address` when no structured part is present. Em-dash when all empty.
 */
export function formatAddress(parts: AddressParts | null | undefined): string {
  if (!parts) return EMPTY;
  const composed = [parts.address_line1, parts.address_line2, parts.city, stateLabel(parts.state_code), parts.zip_code]
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join(', ');
  return composed || (parts.address ?? '').trim() || EMPTY;
}

/** Parse a text field to a number, or null when blank/invalid. */
export function toNumberOrNull(value: string | null | undefined): number | null {
  if (!value || !value.trim()) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}
