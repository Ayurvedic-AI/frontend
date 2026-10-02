import { describe, expect, it } from 'vitest';
import { ApiError } from '../api/client';
import { isPermissionDenied } from './auth-reconcile';

// US6: a 403 from a mutation reconciles the stale local permission set.
describe('isPermissionDenied', () => {
  it('is true for a 403 ApiError', () => {
    expect(isPermissionDenied(new ApiError(403, { detail: 'Forbidden' }))).toBe(true);
  });

  it('is false for other ApiError statuses (401, 422, 500)', () => {
    expect(isPermissionDenied(new ApiError(401, { detail: 'Unauthorized' }))).toBe(false);
    expect(isPermissionDenied(new ApiError(422, { detail: 'Invalid' }))).toBe(false);
    expect(isPermissionDenied(new ApiError(500, { detail: 'Server' }))).toBe(false);
  });

  it('is false for non-ApiError values', () => {
    expect(isPermissionDenied(new Error('network'))).toBe(false);
    expect(isPermissionDenied(null)).toBe(false);
    expect(isPermissionDenied({ status: 403 })).toBe(false);
  });
});
