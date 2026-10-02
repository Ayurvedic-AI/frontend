import { describe, expect, it } from 'vitest';
import { editProfileSchema } from '../useEditProfileForm';

describe('editProfileSchema', () => {
  it('accepts a valid 10-digit phone (stored as digits; +91/grouping is presentation-only)', () => {
    const r = editProfileSchema.safeParse({
      first_name: 'Jyoti',
      last_name: 'Varade',
      phone: '9876543210',
    });
    expect(r.success).toBe(true);
  });

  it('requires first and last name', () => {
    expect(editProfileSchema.safeParse({}).success).toBe(false);
    expect(editProfileSchema.safeParse({ first_name: '', last_name: '' }).success).toBe(false);
  });

  it('allows empty / omitted phone (clears to "not set")', () => {
    expect(editProfileSchema.safeParse({ first_name: 'Jyoti', last_name: 'Varade' }).success).toBe(true);
    expect(
      editProfileSchema.safeParse({ first_name: 'Jyoti', last_name: 'Varade', phone: '' }).success,
    ).toBe(true);
  });

  it('rejects an over-length first name (>100)', () => {
    const r = editProfileSchema.safeParse({ first_name: 'a'.repeat(101), last_name: 'Varade' });
    expect(r.success).toBe(false);
  });

  it('rejects a phone that is not exactly 10 digits (incl. the formatted +91 form)', () => {
    for (const phone of ['98765', '98765432100', '9'.repeat(33), '+91 98765 43210']) {
      const r = editProfileSchema.safeParse({ first_name: 'Jyoti', last_name: 'Varade', phone });
      expect(r.success).toBe(false);
    }
  });

  it('rejects a phone with invalid characters', () => {
    const r = editProfileSchema.safeParse({
      first_name: 'Jyoti',
      last_name: 'Varade',
      phone: '123-abc',
    });
    expect(r.success).toBe(false);
  });
});
