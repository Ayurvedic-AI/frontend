# School ERP — frontend

React 19 + TypeScript + Vite 8 + Tailwind v4. Forms: react-hook-form + zod. Data: TanStack Query.
Routing: react-router 7. API SDK: Orval → `src/sdk/` (generated, currently empty — design phase).
Package manager: **bun** (`bun.lock`).

## Commands
```bash
bun dev                 # http://localhost:5173  (component library: /#__component-library)
bun run build           # tsc -b + vite build  — must pass before any hand-off
bun run test            # vitest, once
bun run lint            # eslint (bans @mui/*, @emotion/*, raw fetch in features)
bun run build:preview   # ONE dist/index.html for client sharing (hash routing)
bun run sdk:gen         # later: regenerate src/sdk from the backend OpenAPI
```

## Read before building anything
1. `DESIGN.md` — tokens, type scale, screen anatomy, component map. The design system.
2. `CODE-STANDARDS.md` — mandatory code rules + PR checklist.
3. `src/features/README.md` — feature-folder layout (auth is the canonical example).
4. `src/routes/README.md` — how routes/guards work.
5. The matching skill in `.claude/skills/` (new-feature-screen, design-review, design-tokens, share-design, api-integration).

## Folder map
```
src/
├── common/      shared component library (kebab-case folders, one component each) — USE THESE
├── features/    one folder per product area: pages/ components/ hooks/ api/ index.ts
├── routes/      route table + Protected/Unprotected guards + app shell layout
├── api/         hand-written fetch client, CSRF, Orval mutator (do not touch in design phase)
├── sdk/         Orval output — never edit by hand, never import in design phase
├── lib/         cn(), query-client
├── utils/       pure helpers (formatters, parsers) — put reusable logic here
├── pages/__component-library/  dev-only showcase of every common component
└── index.css    @theme design tokens — the ONLY place colors/fonts/radii are defined
_reference/      old code kept for pattern reference; not compiled; never import from it
```

## Hard rules (design phase)
- **No API integration.** No `fetch`, no `src/sdk` imports, no new `src/api` code. Screens read static
  data from `features/<name>/api/<name>-stubs.ts`. Auth uses `features/auth/api/auth-stubs.ts`
  (any email/password signs in). Keep hook names identical to what Orval will generate.
- **Tokens only.** No raw hex, no `text-green-700`-style palette classes, no inline colors. Use
  `bg-primary`, `text-muted-foreground`, `border-border`, `bg-positive-01`, … (see DESIGN.md).
- **Common components only.** Never a native `<input>/<select>/<button>`; use `src/common/*`
  (RHF wrappers for forms, `CustomButton`, `CommonTable`, `CustomDrawer`, …). Missing something?
  Add it to `src/common/<kebab-name>/` with an `index.ts`, export from `src/common/index.ts`, and
  showcase it in `pages/__component-library`.
- **One screen = one feature page.** `features/<name>/pages/<Name>Page.tsx`, exported by name via
  `index.ts`, lazy-registered in `routes/routes.tsx`, linked in `features/navbar/nav-links.tsx`,
  permission-mapped in `features/auth/permissions/permission-map.ts` (+ `permission-keys.ts`).
- **Brand** is `BrandLogo` from `src/common/brand-logo`; never inline a logo or product name elsewhere.
- **Placeholders are actions** ("Enter name", "Select class"), never sample values. Sample *data* for
  mockups lives in stubs only.
- Follow CODE-STANDARDS.md §6–8: create/edit in a right half-drawer, search+filters top-right,
  table loading via `CommonTable`'s skeleton.
- Every screen must work at 375 px, 768 px and 1280 px.
- Before hand-off: `bun run lint && bun run test && bun run build` all green.

## Definition of done for a mockup screen
Page + stub data + route + nav link + permission map + passes `design-review` skill checklist +
shared via `share-design` skill.
