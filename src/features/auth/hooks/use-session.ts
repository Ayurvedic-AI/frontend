/**
 * Convenience wrapper around `useAuth` + an explicit `/auth/me` query for
 * pages that want to render a freshness-aware spinner without going through
 * the global AuthContext shape.
 *
 * Returns the same TanStack Query result, with friendly aliases.
 */
import { useQuery } from '@tanstack/react-query';
import { getAuthMeQueryOptions } from '../api/auth-stubs';
import type { MeResponse } from '../api/auth-stubs';
import { ApiError } from '../../../api/client';

export interface UseSessionResult {
  user: MeResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: unknown;
}

// SDK's authMe queryFn returns the wrapped envelope { data, status, headers }
// from the mutator. Unwrap for consumers.
interface AuthMeEnvelope {
  data: MeResponse;
  status: number;
}

export function useSession(): UseSessionResult {
  const query = useQuery({
    ...getAuthMeQueryOptions(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: (count, err) => {
      if (err instanceof ApiError && err.status === 401) return false;
      return count < 2;
    },
  });

  const isAuthError = query.error instanceof ApiError && query.error.status === 401;
  const envelope = query.data as AuthMeEnvelope | null | undefined;
  const user = envelope?.data ?? null;

  return {
    user,
    isAuthenticated: !!user,
    isLoading: query.isPending && !isAuthError,
    error: isAuthError ? null : query.error,
  };
}
