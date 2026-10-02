# Converting `rebuild/` mockup screens into `frontend/`

Read `CLAUDE.md` first — it owns the app's stack and hard rules. This doc is the repeatable
process for taking one screen from the reverse-engineered `rebuild/` mockup (CRA, MUI/Bootstrap,
no design system) and rebuilding it inside `frontend/src/features/` the right way.

## Source → target mapping

- `rebuild/src/pages/<Domain>/<Screen>.js` → `frontend/src/features/<domain>/pages/<Screen>Page.tsx`
- One `frontend` feature folder per `rebuild` domain module, not per page — e.g. `Student/` →
  `features/student/`, `Fee/` → `features/fee/`, `Teacher/` → `features/teacher/`,
  `Kird/` → `features/accounts/` (renamed — "Kird" isn't a clear name), `Poshanaahar/` →
  `features/nutrition/`, plus `result/`, `CBSE/`, `IcseResult/`, `Timetable/`, `Attendance/`,
  `Inventory/`, `Exam/`, `Crm/`, `PaymentIntegration/`, `School/`. Use kebab-case feature names.
- `rebuild/src/index.js` has the authoritative route table (~138 `<Route>` entries) — use it, and
  the page file itself, to know a screen's real path/fields/actions. Don't reinvent them.

## Conversion steps, per screen

1. Read the source page in `rebuild/` — fields, layout, actions, and any module-shared CSS it
   pulls in (e.g. `Fee/Pavatino.css`, `Kird/style1.css`).
2. Use the `new-feature-screen` skill to scaffold the feature (page/components/hooks/api/stub
   layout) instead of hand-rolling folders.
3. Rebuild the UI with `src/common/*` primitives only — never a native `<input>/<select>/<button>`.
   Map old elements to their equivalent: MUI `TextField` / Bootstrap `<input>` → `RHFInput` /
   `CustomInput`; `<select>` → `RHFSelect` / `CustomSelect`; MUI `Dialog` → `CustomDialog`;
   DataTables/tables → `CommonTable`; date pickers → `date-picker-field`.
4. Replace all raw hex, inline styles, and Bootstrap/MUI palette classes with design tokens
   (`bg-primary`, `text-muted-foreground`, …) per `DESIGN.md` / `src/index.css`.
5. Convert plain `useState`-driven controlled forms to `react-hook-form` + `zod`, matching the
   `features/auth` pattern.
6. Turn whatever the old page fetched via Firebase/axios into static stub data in
   `features/<name>/api/<name>-stubs.ts` — no live calls (design-phase rule). Keep stub hook names
   aligned to what a future Orval SDK would generate.
7. Register the route (lazy) in `routes/routes.tsx`, add a nav entry in
   `features/navbar/nav-links.tsx`, and add a permission mapping in
   `features/auth/permissions/permission-map.ts` (+ `permission-keys.ts`).
8. Follow `CODE-STANDARDS.md` §6–8: create/edit in a right half-drawer, search+filters top-right,
   table loading via `CommonTable`'s skeleton. Verify at 375px, 768px, 1280px.
9. Run the `design-review` skill checklist before calling it done; use `share-design` to hand it off.

Definition of done is the same as in `CLAUDE.md`: page + stub data + route + nav link +
permission map + passes `design-review` + shared via `share-design`.

## Don't port as-is

- `WithAuth.js` / localStorage+SHA256 auth — `features/auth` already replaces this.
- Firebase/axios calls, jspdf/html2pdf export code, chart.js, etc. — backend/export concerns,
  revisit with the `api-integration` skill once there's a real backend.
- `rebuild`'s inconsistent file/route naming (`Pavatino1.js`, stray filenames, mixed-case routes)
  — follow `src/features/README.md` naming instead.
- Public/unauthenticated web-result routes (`WebResults/`, multi-param dynamic URLs) — a different
  concern from logged-in feature screens. Note them, don't force-fit them into the `features/`
  pattern; decide separately when you reach them.

## Suggested order

Start with a self-contained, high-traffic domain (e.g. `Student`) as the next real feature after
`auth`/`dashboard`, to prove the pattern end-to-end, then proceed module by module.
