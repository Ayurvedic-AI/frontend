import { describe, expect, it } from 'vitest';
import { changePasswordSchema } from '../useChangePasswordForm';

const base = {
  currentPassword: 'Old-Passw0rd!',
  newPassword: 'New-Passw0rd!',
  confirmPassword: 'New-Passw0rd!',
};

describe('changePasswordSchema', () => {
  it('accepts a policy-compliant new password', () => {
    expect(changePasswordSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a new password shorter than 10 characters', () => {
    const r = changePasswordSchema.safeParse({ ...base, newPassword: 'Ab1!xyz', confirmPassword: 'Ab1!xyz' });
    expect(r.success).toBe(false);
  });

  it('rejects a new password with fewer than 3 character classes', () => {
    // 12 lowercase letters: long enough, but only 1 class.
    const weak = 'abcdefghijkl';
    const r = changePasswordSchema.safeParse({ ...base, newPassword: weak, confirmPassword: weak });
    expect(r.success).toBe(false);
  });

  it('rejects when confirmation does not match', () => {
    const r = changePasswordSchema.safeParse({ ...base, confirmPassword: 'Different-1!' });
    expect(r.success).toBe(false);
  });

  it('rejects when the new password equals the current password', () => {
    const same = 'Same-Passw0rd!';
    const r = changePasswordSchema.safeParse({
      currentPassword: same,
      newPassword: same,
      confirmPassword: same,
    });
    expect(r.success).toBe(false);
  });

  it('rejects an empty current password', () => {
    const r = changePasswordSchema.safeParse({ ...base, currentPassword: '' });
    expect(r.success).toBe(false);
  });
});
