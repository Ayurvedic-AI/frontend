import { describe, expect, it } from 'vitest';
import { formatIndianPhone, formatIndianPhoneInput, normalizeIndianPhone } from './phone';

describe('normalizeIndianPhone', () => {
  it('strips separators down to national digits', () => {
    expect(normalizeIndianPhone('+91 98765 43210')).toBe('9876543210');
    expect(normalizeIndianPhone('(98765) 43210')).toBe('9876543210');
    expect(normalizeIndianPhone('98765-43210')).toBe('9876543210');
  });

  it('drops a pasted +91 / 91 country prefix', () => {
    expect(normalizeIndianPhone('+919876543210')).toBe('9876543210');
    expect(normalizeIndianPhone('919876543210')).toBe('9876543210');
  });

  it('drops a single leading trunk 0', () => {
    expect(normalizeIndianPhone('098765 43210')).toBe('9876543210');
  });

  it('strips the mask\'s own "+91 " prefix on re-parse without eating national 91s', () => {
    // The input field is re-parsed on every keystroke; "+91 " must not be re-absorbed.
    expect(normalizeIndianPhone('+91 98')).toBe('98');
    expect(normalizeIndianPhone('+91 98765 4')).toBe('987654');
    // A national number that genuinely starts with 91 is preserved (no "+").
    expect(normalizeIndianPhone('9123456789')).toBe('9123456789');
    expect(normalizeIndianPhone('+91 91234 56789')).toBe('9123456789');
  });

  it('caps at 10 digits and tolerates junk', () => {
    expect(normalizeIndianPhone('98765432109999')).toBe('9876543210');
    expect(normalizeIndianPhone('abc')).toBe('');
    expect(normalizeIndianPhone('')).toBe('');
  });

  it('always returns 0-10 digits', () => {
    for (const input of ['1', '12345', '9876543210', '+91 98765 43210', 'N/A']) {
      expect(normalizeIndianPhone(input)).toMatch(/^\d{0,10}$/);
    }
  });
});

describe('formatIndianPhoneInput (progressive mask)', () => {
  it('builds the +91 5-5 mask as digits accrue', () => {
    expect(formatIndianPhoneInput('')).toBe('');
    expect(formatIndianPhoneInput('9')).toBe('+91 9');
    expect(formatIndianPhoneInput('98765')).toBe('+91 98765');
    expect(formatIndianPhoneInput('987654')).toBe('+91 98765 4');
    expect(formatIndianPhoneInput('9876543210')).toBe('+91 98765 43210');
  });

  it('normalizes pasted input before masking', () => {
    expect(formatIndianPhoneInput('+919876543210')).toBe('+91 98765 43210');
    expect(formatIndianPhoneInput('098765 43210')).toBe('+91 98765 43210');
  });

  it('is stable when re-fed its own output (keystroke simulation)', () => {
    expect(formatIndianPhoneInput('+91 98')).toBe('+91 98');
    expect(formatIndianPhoneInput('+91 987654')).toBe('+91 98765 4');
    expect(formatIndianPhoneInput('+91 91234 56789')).toBe('+91 91234 56789');
  });
});

describe('formatIndianPhone (display)', () => {
  it('formats a stored 10-digit value', () => {
    expect(formatIndianPhone('9876543210')).toBe('+91 98765 43210');
  });

  it('normalizes legacy separators / country code to the standard display', () => {
    expect(formatIndianPhone('98765 43210')).toBe('+91 98765 43210');
    expect(formatIndianPhone('+919876543210')).toBe('+91 98765 43210');
  });

  it('returns "" for empty / nullish so callers keep their own empty indicator', () => {
    expect(formatIndianPhone('')).toBe('');
    expect(formatIndianPhone(null)).toBe('');
    expect(formatIndianPhone(undefined)).toBe('');
  });

  it('returns non-conforming legacy values unchanged (graceful)', () => {
    expect(formatIndianPhone('12345')).toBe('12345');
    expect(formatIndianPhone('legacy-weird-value')).toBe('legacy-weird-value');
  });

  it('agrees with the input mask for a valid 10-digit number', () => {
    expect(formatIndianPhone('9876543210')).toBe(formatIndianPhoneInput('9876543210'));
  });
});
