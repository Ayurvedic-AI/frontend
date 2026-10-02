import { MutationCache, QueryClient } from '@tanstack/react-query';
import { toast } from '../common/common-snackbar';
import { getAuthMeQueryKey } from '../features/auth/api/auth-stubs';
import { isPermissionDenied } from './auth-reconcile';

/**
 * Project-wide TanStack Query client.
 *
 * Defaults chosen for safety:
 *  - staleTime 30s          — avoid request stampedes from tight refetch loops
 *  - refetchOnWindowFocus false — don't surprise the user with unrequested reloads
 *  - retry 1                 — single retry, then surface the error to the UI
 *
 * Feature code may override per-query via useQuery({ ... }).
 *
 * A global mutation `onError` reconciles a stale permission set (feature 039,
 * FR-023): when any mutation is rejected with 403, the UI surfaces a clear
 * message and refetches `/auth/me` so gating reflects the user's current grants.
 *
 * A global mutation `onSuccess` invalidates all queries after *any* successful
 * write, so every screen reflects the change without a manual page reload. This
 * fixes cross-feature staleness where a write changes data the current screen
 * doesn't own — e.g. posting a GRN updating the Inventory → Stock / Batches /
 * Movements tabs, completing a Manufacturing Order updating finished-goods stock,
 * or allocating a Sales Order updating availability. Active queries refetch right
 * away; inactive ones are marked stale and refetch the next time they mount.
 */
export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
    onError: (error) => {
      if (isPermissionDenied(error)) {
        toast({
          severity: 'error',
          message: "You no longer have permission to do that — your access has been refreshed.",
        });
        void queryClient.invalidateQueries({ queryKey: getAuthMeQueryKey() });
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
