import { z } from 'zod';
import { isKnownState } from './indian-states';

/**
 * Shared Zod field validators so masters/inventory/CRM forms validate the same
 * way. Keep field-level rules here (per CODE-STANDARDS rule 1) instead of
 * re-declaring them inline in every form hook.
 *
 * Identifier fields (code/GSTIN) are paired with `uppercase` on their RHFInput,
 * so the value reaching these validators is already upper-cased.
 */

/** Short identifier code: uppercase alphanumeric + dash/underscore, max 50. */
export function codeField(max = 50) {
  return z
    .string()
    .trim()
    .min(1, 'Code is required')
    .max(max)
    .regex(/^[A-Z0-9][A-Z0-9_-]*$/, 'Use uppercase letters, numbers, - or _ (no spaces)');
}

/** Optional GSTIN: a valid 15-character GST identifier when present. */
export function gstinOptional() {
  return z
    .string()
    .trim()
    .optional();
}

/** Optional GST state code when present — must be a REAL state from the
 *  Indian-states list (not just any 2 digits), so a mistyped/legacy value can't
 *  save silently. Values come from the State dropdown (utils/indian-states.ts). */
export function stateCodeOptional() {
  return z
    .string()
    .trim()
    .optional()
    .refine(isKnownState, 'Select a state from the list');
}

/** Optional HSN code: 4, 6 or 8 digits when present. */
export function hsnOptional() {
  return z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^\d{4}(?:\d{2}){0,2}$/.test(v), 'HSN must be 4, 6 or 8 digits');
}

/** Optional URL that, when present, must be a valid http(s) link. */
export function urlOptional(max = 300) {
  return z
    .string()
    .trim()
    .max(max)
    .optional()
    .refine((v) => !v || /^https?:\/\/.+/.test(v), 'Enter a valid URL (https://…)');
}

/** Specific, staged message for an invalid Indian mobile so the user knows
 *  exactly what to fix (length first, then the 6-9 leading-digit rule). */
function phoneIssue(digits: string): string | null {
  if (digits.length !== 10) {
    return `Mobile number must be 10 digits — you've entered ${digits.length}`;
  }
  if (!/^[6-9]/.test(digits)) return 'Mobile number must start with 6, 7, 8 or 9';
  return null;
}

/** Optional phone that, when present, must be a real Indian mobile —
 *  10 digits starting 6-9 (a number like 24323 23432 is not dialable/WhatsApp-able). */
export function phoneOptional() {
  return z
    .string()
    .trim()
    .optional()
    .superRefine((v, ctx) => {
      if (!v) return;
      const issue = phoneIssue(v);
      if (issue) ctx.addIssue({ code: z.ZodIssueCode.custom, message: issue });
    });
}

/** Optional email that, when present, must be a valid address. */
export function emailOptional() {
  return z
    .string()
    .trim()
    .email('Enter a valid email')
    .or(z.literal(''))
    .optional();
}

/** Required phone: a real Indian mobile — 10 digits starting 6-9. */
export function phoneRequired() {
  return z
    .string()
    .trim()
    .min(1, 'Phone is required')
    .superRefine((v, ctx) => {
      const issue = phoneIssue(v);
      if (issue) ctx.addIssue({ code: z.ZodIssueCode.custom, message: issue });
    });
}

/** Optional Indian PIN code that, when present, must be 6 digits. */
export function zipOptional() {
  return z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^[1-9]\d{5}$/.test(v), 'Enter a valid 6-digit PIN code');
}
