---
name: new-feature-screen
description: Scaffold a new School ERP screen (feature folder, static stub data, lazy route, nav link, permission) following the project's feature-folder pattern. Use whenever asked to design, mock up, add, or build a screen/page/module (students, fees, attendance, …).
---

# New feature screen

Read `CLAUDE.md`, `DESIGN.md` and `src/features/README.md` first. `features/auth` and
`features/dashboard` are the live examples; `_reference/features/*` shows list+drawer patterns.

## Steps
1. **Name it.** kebab-case feature `<name>` (e.g. `students`), PascalCase page `<Name>Page`.
2. **Scaffold**
   ```
   src/features/<name>/
   ├── api/<name>-stubs.ts     # exported TS types + static arrays (10–15 realistic rows)
   ├── components/             # feature-private pieces (table columns, drawer form, pills)
   ├── hooks/use<Name>Form.ts  # zod schema + useForm (only if the screen has a form)
   ├── pages/<Name>Page.tsx    # route-level component, named export
   └── index.ts                # export { <Name>Page } from './pages/<Name>Page';
   ```
3. **Build the page** using the anatomy in `DESIGN.md §4` and only `src/common/*` components:
   page header → toolbar (search/filters right) → `CommonTable` → pagination; create/edit in
   `CustomDrawer anchor="right"` with RHF wrappers; delete via `ConfirmationPopUp`; `toast()` feedback.
   Show loading (`loading` prop), empty and populated states — toggle via stub flags if useful.
4. **Register**
   - `src/routes/routes.tsx`: add a `lazyWithPreload` import + `<Route path="<name>" element={guarded('<feature>.view', <Page />)} />`.
   - `src/features/auth/permissions/permission-keys.ts`: add `'<feature>'` to `Feature` if new.
   - `src/features/auth/permissions/permission-map.ts`: add `'/<name>': '<feature>.view'` to `NAV_PERMISSION` and `NAV_ORDER`.
   - `src/features/navbar/nav-links.tsx`: add the link under the right group (lucide icon, `ICON` class).
   - `src/features/auth/api/auth-stubs.ts`: add the feature to `DEMO_USER.permissions` list.
5. **Verify** `bun run lint && bun run test && bun run build`, then open `bun dev` at 375 / 768 / 1280 px.
6. Run the `design-review` skill checklist, then `share-design` if the client needs to see it.

## Don'ts
No `fetch`, no `src/sdk` imports, no raw hex/palette classes, no native inputs, no new dependencies.
