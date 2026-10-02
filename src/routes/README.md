# Routing — protected & unprotected pattern

The app uses a flat route table (no `/clinician/*` or `/admin/*` prefix). A
single pathless parent route applies `<ProtectedRoute>` + `<ProtectedLayout>`
to every protected child, so the navbar / suspense chrome renders once and
the children mount inside its `<Outlet />`.

## Files

| File | Purpose |
|------|---------|
| [`ProtectedRoute.tsx`](./ProtectedRoute.tsx) | Wrapper that reads `useAuth()`. If signed out, `<Navigate to="/login" replace state={{ from: location }} />`. If still loading, renders a centered spinner. Otherwise renders children. |
| [`UnprotectedRoute.tsx`](./UnprotectedRoute.tsx) | Wrapper for public pages. If signed in, redirects to `/dashboard`. Includes the `/set-password` special case that accepts a `token` / `userId` from URL params or `location.state`. |
| [`ProtectedLayout.tsx`](./ProtectedLayout.tsx) | Shared shell for every protected route: `<Navbar />` + `<Suspense>` + `<Outlet />`, offset by `NAVBAR_HEIGHT`. |
| [`routes.tsx`](./routes.tsx) | `AppRoutes` — the actual `<Routes>` table. Auth pages are lazy-loaded via `lazyWithPreload`. |

## Recipes

### Add a new protected page

In `routes.tsx`, drop a `<Route>` inside the pathless protected parent:

```tsx
<Route
  element={
    <ProtectedRoute>
      <ProtectedLayout />
    </ProtectedRoute>
  }
>
  <Route path="dashboard" element={<DashboardPlaceholder />} />
  {/* … */}
  <Route path="new-page" element={<NewPage />} />   {/* ← here */}
</Route>
```

`<NewPage />` is rendered inside `<ProtectedLayout />`'s `<Outlet />`, so the
navbar appears automatically and signed-out users get bounced to `/login`.

### Add a new public page (e.g. marketing)

```tsx
<Route
  path="about"
  element={
    <UnprotectedRoute>
      <Suspense fallback={<PageLoader />}>
        <AboutPage />
      </Suspense>
    </UnprotectedRoute>
  }
/>
```

`<UnprotectedRoute>` redirects already-signed-in users to `/dashboard`.

### Add a route that bypasses both guards

Just declare a top-level `<Route>` with no wrapper element. Useful for
share links, embeddable views, or public marketing pages.

```tsx
<Route path="shared/:token" element={<SharedView />} />
```

## Current route table

**Default**:
- `/` → `/dashboard`

**Public (auth)** — wrapped in `<UnprotectedRoute>`:
- `/login` → Sign In
- `/forgot-password`
- `/enter-otp`
- `/set-password`

**Protected** — wrapped in `<ProtectedRoute><ProtectedLayout />`: see
`routes.tsx` for the full, permission-guarded route table (the old placeholder
stub routes were removed in the 2026-07-02 dead-code sweep).

**Catch-all**:
- `*` → first permitted page (`LandingRedirect`)
