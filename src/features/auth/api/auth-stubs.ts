/**
 * Design-phase auth stubs — stand-ins for the Orval-generated
 * `src/sdk/authentication` module so the app boots with NO backend.
 *
 * Export names and call shapes mirror the generated SDK (mutations take
 * `{ mutation }` options, resolve to the `{ data, status, headers }` envelope),
 * so switching to the real thing is an import-path change only — see
 * `.claude/skills/api-integration/SKILL.md`.
 */
import {
  queryOptions,
  useMutation,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { ApiError } from '../../../api/client';

// ── Types (subset of the backend's MeResponse the UI actually reads) ────────
export interface LoginUserOut {
  uuid: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  role: string;
  permissions?: string[];
}
export interface MeResponse extends LoginUserOut {
  is_active: boolean;
}

interface Envelope<T> {
  data: T;
  status: number;
  headers: Headers;
}

const DEMO_USER: MeResponse = {
  uuid: 'demo-admin',
  email: 'admin@school.edu',
  first_name: 'Demo',
  last_name: 'Admin',
  role: 'Admin',
  // Every feature the UI knows about; see permission-keys.ts.
  permissions: [
    'dashboard',
    'patients',
    'ai_summary',
    'students',
    'teachers',
    'classes',
    'attendance',
    'timetable',
    'fees',
    'exams',
    'users',
    'roles',
  ].flatMap((f) => ['view', 'create', 'update', 'delete'].map((a) => `${f}.${a}`)),
  is_active: true,
};

// ponytail: sessionStorage flag stands in for the backend's HttpOnly cookies;
// disappears when the real SDK is wired in (cookies are set by the server).
const SESSION_KEY = 'school-erp:demo-session';
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

const ok = <T,>(data: T): Envelope<T> => ({ data, status: 200, headers: new Headers() });

// ── /auth/me ────────────────────────────────────────────────────────────────
export const getAuthMeQueryKey = () => ['/api/v1/auth/me'] as const;

export const getAuthMeQueryOptions = () =>
  queryOptions({
    queryKey: getAuthMeQueryKey(),
    queryFn: async () => {
      await delay(150);
      if (sessionStorage.getItem(SESSION_KEY) !== '1') {
        throw new ApiError(401, { detail: 'Not authenticated' });
      }
      return ok(DEMO_USER);
    },
  });

// ── Mutations ───────────────────────────────────────────────────────────────
type Opts<TData, TVars> = { mutation?: UseMutationOptions<TData, ApiError, TVars> };

function useStubMutation<TVars, TData>(
  run: (vars: TVars) => Promise<TData>,
  options?: Opts<TData, TVars>,
) {
  return useMutation<TData, ApiError, TVars>({ mutationFn: run, ...options?.mutation });
}

export const useAuthLogin = (
  options?: Opts<Envelope<{ user: LoginUserOut }>, { data: { username: string; password: string } }>,
) =>
  useStubMutation(async () => {
    await delay();
    sessionStorage.setItem(SESSION_KEY, '1');
    return ok({ user: DEMO_USER });
  }, options);

export const useAuthLogout = (options?: Opts<Envelope<null>, void>) =>
  useStubMutation(async () => {
    await delay(150);
    sessionStorage.removeItem(SESSION_KEY);
    return ok(null);
  }, options);

export const useAuthForgotPassword = (options?: Opts<Envelope<null>, { data: { email: string } }>) =>
  useStubMutation(async () => (await delay(), ok(null)), options);

export const useAuthVerifyOtp = (
  options?: Opts<Envelope<{ reset_token: string }>, { data: { email: string; otp: string } }>,
) => useStubMutation(async () => (await delay(), ok({ reset_token: 'demo-token' })), options);

export const useAuthResetPassword = (
  options?: Opts<Envelope<null>, { data: { reset_token: string; new_password: string } }>,
) => useStubMutation(async () => (await delay(), ok(null)), options);

export const useAuthAcceptInvitation = (
  options?: Opts<Envelope<null>, { data: { invitation_token: string; new_password: string } }>,
) => useStubMutation(async () => (await delay(), ok(null)), options);
