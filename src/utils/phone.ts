/**
 * Indian phone-number helpers (feature 041).
 *
 * Phone numbers are STORED as 10 national digits (e.g. "9876543210"); the
 * "+91", spaces and 5-5 grouping are presentation-only. India is assumed —
 * there is no country picker, so "+91" is applied automatically.
 *
 * Single source of truth for both the input mask (CustomInput `phone` branch)
 * and read-only display (tables/detail/profile).
 */

/**
 * Recover the 10 national digits from arbitrary / pasted input.
 * Strips every non-digit, then drops a pasted country/trunk prefix:
 *   - a leading "91" on a 12-digit string, or
 *   - a single leading "0" on an 11-digit string,
 * and finally caps at 10 digits. Output always matches /^\d{0,10}$/.
 */
export function normalizeIndianPhone(raw: string): string {
  // Strip an explicit "+91" country prefix FIRST. The input mask always renders
  // a literal "+91 " prefix, so the field value is re-parsed here on every
  // keystroke; stripping the exact "+91" prevents its "91" from being re-absorbed
  // as national digits. A bare national number starting with 91 has no "+", so
  // it is preserved.
  const stripped = (raw ?? '').trim().replace(/^\+91[\s-]*/, '');
  let digits = stripped.replace(/\D/g, '');
  // Bare pasted prefixes that lack the leading "+":
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

/** Group up to 10 national digits as "+91 98765 43210" (partial-aware). Empty → "". */
function groupNational(digits: string): string {
  if (digits.length === 0) return '';
  if (digits.length <= 5) return `+91 ${digits}`;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

/**
 * Progressive input mask used while the user types.
 * Any input → "+91 98765 43210" shape for whatever digits are present.
 * Empty → "".
 */
export function formatIndianPhoneInput(raw: string): string {
  return groupNational(normalizeIndianPhone(raw));
}

/**
 * Read-only display of a stored value.
 *   - empty / nullish            → ""  (callers keep their own "—"/"Not set")
 *   - exactly 10 national digits → "+91 98765 43210"
 *   - anything else (legacy)     → returned unchanged (graceful, never throws)
 */
export function formatIndianPhone(value: string | null | undefined): string {
  if (value == null) return '';
  const trimmed = String(value).trim();
  if (trimmed === '') return '';
  const digits = normalizeIndianPhone(trimmed);
  if (digits.length === 10) return groupNational(digits);
  return trimmed;
}
