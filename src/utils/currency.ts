/**
 * Shared INR money formatter (CODE-STANDARDS rule 1 — reusable formatters live
 * in utils, not duplicated per feature). Used by payments, sales-orders and
 * stock-returns.
 *
 * "1500.5" → "₹1,500.50" · null/"" → "—" · non-numeric → returned as-is.
 */
export function formatINR(v: string | null | undefined): string {
  if (v == null || v === '') return '—';
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
