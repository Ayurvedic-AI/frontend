/* eslint-disable react-refresh/only-export-components */
/**
 * Cookie-based AuthProvider.
 *
 * Bootstrap is `GET /auth/me`:
 *  - 200 → user populated, `isAuthenticated = true`.
 *  - 401 → user is `null`, `isAuthenticated = false`.
 *
 * No localStorage r
 * eads or writes. Cookies are managed by the backend; the
 * browser attaches them automatically because `credentials: 'include'` is set
 * on every API call. The CSRF cookie is read by the request interceptor in
 * `src/api/client.ts` and echoed back as `X-CSRF-Token`.
 *
 * `signIn(user)` updates the in-memory user after a successful POST /auth/login
 * (the actual cookies are set by the server response). `signOut()` clears
 * client-side state and refetches /auth/me so any concurrent tab reflects the
 * change.
 */
import { useCallback, useMemo, type ReactNode } from 'react';
import { createContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../../../api/client';
import { getAuthMeQueryOptions, getAuthMeQueryKey } from '../api/auth-stubs';
import type { MeResponse } from '../api/auth-stubs';

export type AuthUser = MeResponse;

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
  refetchMe: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

// Cache shape produced by the SDK's authMe queryFn: the mutator-wrapped
// envelope { data: MeResponse, status, headers }. We unwrap for consumers.
interface AuthMeEnvelope {
  data: AuthUser;
  status: number;
}

const QUERY_KEY = getAuthMeQueryKey();

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    ...getAuthMeQueryOptions(),
    // staleTime + refetchOnWindowFocus are the permission-propagation mechanism
    // (feature 039, US6): when an admin changes a role's grants, the holder's
    // cached `permissions` refresh on the next focus/stale refetch — no re-login.
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: (count, err) => {
      // 401 is "not authenticated" — never retry.
      if (err instanceof ApiError && err.status === 401) return false;
      return count < 2;
    },
  });

  const signIn = useCallback(
    (user: AuthUser) => {
      // Prime the cache so consumers see the user immediately after login,
      // without waiting for a /auth/me round-trip. The SDK stores the
      // envelope shape — we mirror that here so subsequent reads of
      // `query.data.data` work the same as a real fetch result.
      queryClient.setQueryData(QUERY_KEY, {
        data: user,
        status: 200,
        headers: new Headers(),
      });
    },
    [queryClient],
  );

  const signOut = useCallback(() => {
    // Clears the cached MeResponse — including its `permissions` (feature 039) —
    // so no grants leak into the next session/account.
    queryClient.setQueryData(QUERY_KEY, null);
    // Invalidate so the next mount/focus re-checks against the server.
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  const refetchMe = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  const value = useMemo<AuthState>(() => {
    const isAuthError = query.error instanceof ApiError && query.error.status === 401;
    const envelope = query.data as AuthMeEnvelope | null | undefined;
    const user = envelope?.data ?? null;
    return {
      user,
      isAuthenticated: !!user,
      // Only "loading" on the very first round trip. Once we've resolved
      // (success OR 401), don't keep ProtectedRoute spinning.
      isLoading: query.isPending && !isAuthError,
      signIn,
      signOut,
      refetchMe,
    };
  }, [query.data, query.error, query.isPending, signIn, signOut, refetchMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
