# Frontend Code Standards & PR Review Rules (svm-fe)

These are mandatory for **new development and refactors** — dialogs/drawers, forms,
filters, tables, settings, every feature module. Any deviation is corrected before merge.

## 1. Reuse utilities — no inline reusable logic in components
- Any reusable **formatter / parser / mapper / helper** lives in `src/utils/`, not inline in a component.
- Reuse across modules instead of duplicating.
- Examples that MUST be utils (not inline):
  - `formatDate(value)` — date display (was inline `fmtDate` in `DoctorPricingTable`).
  - `prettyJson(value)` — JSON preview (was inline `pretty` in `AuditDetailDialog`).
  - `fullName(user)`, currency formatting, numeric parsing, etc.

## 2. Use the common component library — never raw inputs
Always use the shared components in `src/common/`. **Do NOT** use native `input`/`select`/
`textarea`/`checkbox`/`radio`, and do NOT hand-roll one-off inputs.
- Forms = the `src/common/rhf-wrappers/*` (`RHFInput`, `RHFSelect`, `RHFTextarea`,
  `RHFCheckbox`, `RHFRadioGroup`, `RHFDatePicker`, …).
- Tables = `common/common-table`, search = `common/custom-search`, dialogs/drawers =
  `common/custom-dialog` / `common/custom-drawer`, buttons = `common/custom-buttons`, etc.

## 3. RHF wrappers carry their own label — don't pair with `CustomLabel`
The RHF wrappers render their own label via the `label` (+ `required`) prop. Don't add a
separate `CustomLabel` next to them.
```tsx
// ❌  don't
<CustomLabel htmlFor="city" label="City" />
<RHFInput name="city" control={control} placeholder="Pune" />

// ✅  do
<RHFInput name="city" control={control} label="City" placeholder="Enter city" />
```

## 4. Semantic placeholders — not realistic sample data
Use action placeholders, never example values.
- ❌ `Pune`, `Mumbai`, `John`, `Test`, `WH-001`, `Dr. Anjali Rao`
- ✅ `Enter city`, `Enter name`, `Select role`, `Enter code`

## 5. API-driven toast messages — never hardcode
Show the message the backend returns; do not invent copy.
- **Errors:** use the API message — this backend returns `{ "detail": "…" }`, so use
  `error.body.detail` (see `actionError` in `features/users/pages/UsersPage.tsx`).
- **Success:** use the API's success message when present.
  > ⚠️ Open item for the team: our mutation responses don't currently include a `message`
  > field (they return the resource or `204`). Either the backend adds a `message`, or we
  > agree a single helper that maps the response → text. Don't scatter hardcoded strings.
- Applies to every mutation: create / update / delete / status / upload / auth.

## 6. Forms open in a right-side half-drawer (quick add/edit)
Create/edit forms open as a **half drawer** (`common/custom-drawer`, `anchor="right"`),
not a center dialog. Confirmations stay in `confirmation-pop-up`.

## 7. Search + filters live in the top-right of the toolbar
Search box and filter controls sit at the **right-hand corner** of the screen toolbar.

## 8. Loading via the table's skeleton — no custom spinners in tables
Pass `loading` to `CommonTable` (it renders `TableSkeleton`). Don't build ad-hoc loaders for
`isLoading` / `isPending` table states.

## 9. General
- Follow existing architecture; reuse shared hooks/components/utils; avoid duplicate logic.
- Keep components clean and minimal; business logic out of UI where reasonable.
- Consistent naming; prefer centralized abstractions.

## PR review checklist
- [ ] Shared common components used (no raw inputs)
- [ ] RHF wrappers use built-in `label` (no separate `CustomLabel`)
- [ ] Reusable helpers in `src/utils/` (no inline duplicates)
- [ ] Semantic placeholders
- [ ] API-driven toast messages (no hardcoded copy)
- [ ] Forms in a right-side half-drawer; search/filters top-right
- [ ] Table loading via `CommonTable` skeleton
- [ ] No duplicated logic; architecture-consistent; maintainable
