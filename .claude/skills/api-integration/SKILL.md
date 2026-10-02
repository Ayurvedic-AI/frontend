---
name: api-integration
description: Wire approved mockup screens to the real backend via the Orval-generated SDK, replacing design-phase stubs. Use only after the client approves designs and a backend OpenAPI document exists; triggers on "integrate API", "connect backend", "replace stubs", "sdk:gen".
---

# API integration (post-approval)

Pre-req: backend running with `/api/v1/openapi.json` (URL in `.env.local` → `OPENAPI_URL`).

1. **Generate** `bun run sdk:gen` — `scripts/sdk-gen.sh` guards against wiping `src/sdk` when the
   backend is unreachable. Output: one file per OpenAPI tag + `src/sdk/schemas/`. Never edit output.
2. **Swap auth first.** Replace imports of `features/auth/api/auth-stubs` with `../../../sdk/authentication`
   (+ types from `sdk/schemas`) in: `auth/context/AuthContext.tsx`, `auth/hooks/use-session.ts`,
   `auth/pages/*.tsx`, `navbar/components/{SidebarUser,UserMenu}.tsx`, `lib/query-client.ts`, and the
   test mocks in `auth/__tests__/AuthContext.test.tsx`, `navbar/components/__tests__/SidebarUser.test.tsx`.
   Delete `auth-stubs.ts`. The stub's export names match Orval's, so nothing else changes.
3. **Per feature**: replace `features/<name>/api/<name>-stubs.ts` with `api/<name>.ts` that wraps the
   generated `get<X>QueryOptions` / `use<X>Mutation` (see `_reference/features/users/api/users.ts`
   for the shape); pages switch from static arrays to `useQuery(...)` + `CommonTable loading`.
4. **Errors/toasts**: show `error.body.detail` via `useFormApiErrors` / `toast()` — never hardcode copy
   (CODE-STANDARDS §5). 403 is handled globally in `lib/query-client.ts`.
5. **Permissions**: `permission-keys.ts` `Feature` union must mirror the backend catalog; the runtime
   set still comes from `/auth/me`.
6. ESLint enforces it: features may not use `fetch` or `apiFetch`; only `src/sdk/*`.
7. Gates: `bun run lint && bun run test && bun run build`.
