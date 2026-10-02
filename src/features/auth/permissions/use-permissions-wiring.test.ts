import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { AuthUser } from '../context/AuthContext';

// US1: the permission set is delivered on the cached MeResponse and read by the
// hook. Present after the (now permissions-complete) login prime, empty once the
// user is cleared on sign-out, and empty for an active role with zero grants.
let mockUser: AuthUser | null = null;
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ user: mockUser }) }));

import { usePermissions } from './use-permissions';

const userWith = (permissions: string[]): AuthUser => ({
  uuid: 'u1',
  email: 'x@example.com',
  role: 'accountant',
  is_active: true,
  permissions,
});

describe('usePermissions wiring (US1)', () => {
  beforeEach(() => {
    mockUser = null;
  });

  it('reflects the permissions delivered on the primed user', () => {
    mockUser = userWith(['dashboard.view', 'payments.view', 'payments.create']);
    const { result } = renderHook(() => usePermissions());
    expect(result.current.canView('payments')).toBe(true);
    expect(result.current.canCreate('payments')).toBe(true);
    expect(result.current.canView('inventory')).toBe(false);
  });

  it('denies everything once the user is cleared (sign-out)', () => {
    mockUser = null;
    const { result } = renderHook(() => usePermissions());
    expect(result.current.permissions.size).toBe(0);
    expect(result.current.has('dashboard.view')).toBe(false);
  });

  it('denies everything for an active role with zero grants', () => {
    mockUser = userWith([]);
    const { result } = renderHook(() => usePermissions());
    expect(result.current.permissions.size).toBe(0);
    expect(result.current.canView('dashboard')).toBe(false);
  });

  it('tolerates a user missing the permissions field (defensive)', () => {
    mockUser = { uuid: 'u1', email: 'x@example.com', role: 'user', is_active: true };
    const { result } = renderHook(() => usePermissions());
    expect(result.current.permissions.size).toBe(0);
  });
});
