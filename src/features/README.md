# `src/features/*` — feature folder pattern

Every product feature in `svm-fe` lives under `src/features/<name>/` and follows the same layout. The auth feature
(`features/auth/`) is the canonical worked example.

## Layout

```text
features/<name>/
├── pages/           # Route-level components, lazy-loaded by routes.tsx
├── components/      # Feature-private presentational components
├── hooks/           # Feature-private hooks (incl. RHF form hooks)
├── context/         # React Context providers private to this feature
├── utils/           # Pure helpers
├── api/             # (optional) Backend integration / stubs
├── __tests__/       # Co-located Vitest tests
└── index.ts         # Public exports (named pages + hooks)
```

- **Pages are always exported by name** (no default exports at the feature
  surface) and re-exported through `index.ts`.
- **Form hooks** declare a `zod` schema + return a `useForm<…>()` with
  `zodResolver`. The form value type is inferred via `z.infer<>`.
- **Tests are colocated** under `__tests__/` (and under the appropriate
  subfolder for non-page units, e.g. `utils/__tests__/`).
- **Anything not in `index.ts` is feature-private.** Other features import
  from the public surface only.

## 5-minute "add a new feature" recipe

1. `mkdir -p src/features/example/{pages,components,hooks,context,utils,__tests__}`
2. Create `pages/ExamplePage.tsx`:

   ```tsx
   export function ExamplePage(): JSX.Element {
     return <div className="p-8 text-2xl">Hello from Example.</div>;
   }
   ```

3. Create `index.ts`:

   ```ts
   export { ExamplePage } from './pages/ExamplePage';
   ```

4. Register in `src/routes/routes.tsx`:

   ```ts
   const ExamplePage = lazyWithPreload(() =>
     import('../features/example/pages/ExamplePage').then((m) => ({ default: m.ExamplePage })),
   );
   ```

5. Add a `<Route>` inside `<AppRoutes>` — wrap in `<ProtectedRoute>` /
   `<UnprotectedRoute>` as needed.

## Authoritative example

See `features/auth/` for the canonical implementation:

- `pages/SignInPage.tsx`, `pages/ForgotPasswordPage.tsx`, `pages/EnterOtpPage.tsx`, `pages/SetNewPasswordPage.tsx`
- `components/AuthLayout.tsx`, `components/OtpInput.tsx`
- `hooks/useAuth.ts`, `hooks/useSignInForm.ts`, `hooks/useForgotPasswordForm.ts`,
  `hooks/useEnterOtpForm.ts`, `hooks/useSetNewPasswordForm.ts`, `hooks/useOtpTimer.ts`
- `context/AuthContext.tsx`
- `utils/clearAuthStorage.ts`
- `api/auth-stubs.ts` (replaceable by the generated SDK)
- `__tests__/AuthContext.test.tsx`
- `index.ts`

## File-naming convention (Constitution Principle IV — interpretation)

Within `features/`, this project allows:

- **PascalCase** for component files (`SignInPage.tsx`, `AuthLayout.tsx`) —
  matches idiomatic React conventions (Next.js, Vite starter, shadcn/ui).
- **camelCase** for hook files (`useSignInForm.ts`) — React community
  convention.
- **kebab-case** for utility / data files (`clear-auth-storage.ts` would be
  fine; `clearAuthStorage.ts` is also fine — pick one per folder, be
  consistent within it).

The migrated `src/common/` library uses strict kebab-case throughout; the
documented exception applies only inside `features/` and `routes/`. See
`specs/002-auth-tailwind-migration/plan.md` Complexity Tracking for the
full justification.
