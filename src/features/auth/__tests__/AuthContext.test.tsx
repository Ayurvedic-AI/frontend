/**
 * Tests for the AuthContext bootstrap.
 *
 * Verifies:
 *  - `/auth/me` (via the auth API module) is the bootstrap source of truth.
 *  - 200 populates the user; 401 clears it.
 *  - `signIn(user)` and `signOut()` are imperative cache updates.
 *  - The provider does not read or write `localStorage`.
 *
 * The auth API module is mocked so these tests hold for both the design-phase
 * stub and the generated SDK (same export names).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '../../../api/client';

let meResult: () => Promise<unknown>;
vi.mock('../api/auth-stubs', () => ({
  getAuthMeQueryKey: () => ['/api/v1/auth/me'],
  getAuthMeQueryOptions: () => ({ queryKey: ['/api/v1/auth/me'], queryFn: () => meResult() }),
}));

import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../hooks/useAuth';
import type { AuthUser } from '../context/AuthContext';

const TEST_USER: AuthUser = {
  uuid: '77777777-7777-7777-7777-777777777777',
  email: 'jane@example.com',
  role: 'user',
  is_active: true,
};

const ok = (user: AuthUser) => async () => ({ data: user, status: 200, headers: new Headers() });
const unauthorized = async () => {
  throw new ApiError(401, { detail: 'Invalid credentials' });
};

function makeWrapper(): React.FC<{ children: ReactNode }> {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={qc}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

let localStorageGetSpy: ReturnType<typeof vi.spyOn>;
let localStorageSetSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  localStorage.clear();
  localStorageGetSpy = vi.spyOn(Storage.prototype, 'getItem');
  localStorageSetSpy = vi.spyOn(Storage.prototype, 'setItem');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AuthProvider — /auth/me bootstrap', () => {
  it('populates the user when /auth/me returns 200', async () => {
    meResult = ok(TEST_USER);
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user).toEqual(TEST_USER);
    expect(result.current.isLoading).toBe(false);
  });

  it('treats 401 as unauthenticated and clears loading', async () => {
    meResult = unauthorized;
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('never reads or writes localStorage', async () => {
    meResult = ok(TEST_USER);
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(localStorageGetSpy).not.toHaveBeenCalled();
    expect(localStorageSetSpy).not.toHaveBeenCalled();
  });
});

describe('AuthProvider — imperative signIn / signOut', () => {
  it('signIn(user) primes the user without a round-trip', async () => {
    meResult = unauthorized;
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.signIn(TEST_USER));
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user).toEqual(TEST_USER);
  });

  it('signOut clears the in-memory user', async () => {
    meResult = ok(TEST_USER);
    const { result } = renderHook(() => useAuth(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    meResult = unauthorized;
    act(() => result.current.signOut());
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
    expect(result.current.user).toBeNull();
  });
});
