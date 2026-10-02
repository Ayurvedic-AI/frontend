---
name: design-review
description: Audit a screen or component against the School ERP design system and code standards (tokens only, common components only, screen anatomy, states, responsive). Use before sharing a mockup with the client or opening a PR, or when asked "review this screen/design".
---

# Design review

Inputs: the feature folder (or files) to review. Output: a short list of violations with file:line
and the fix, then apply fixes if asked.

## Checklist
**Tokens** (`DESIGN.md §1–3`)
- [ ] `grep -nE "#[0-9a-fA-F]{3,6}|(text|bg|border)-(red|green|blue|gray|slate|indigo|amber|emerald|yellow)-[0-9]" src/features/<name>` returns nothing
- [ ] Status pills use `bg-<status>-01 text-<status>-70`
- [ ] Type scale from §2 only; no arbitrary `text-[13px]`

**Components** (`CODE-STANDARDS.md §2–3`)
- [ ] No native `<input|select|textarea|button>` (grep `<input`, `<select`, `<button` — allowed only inside `src/common`)
- [ ] RHF wrappers carry their own `label`/`required`; no `CustomLabel` beside them
- [ ] `CustomButton` for every action; `ActionMenu` for row actions

**Anatomy** (`DESIGN.md §4`, `CODE-STANDARDS.md §6–8`)
- [ ] Title + description top-left; primary action top-right of header
- [ ] Search + filters top-right of toolbar
- [ ] Create/edit in right half-drawer; destructive in `ConfirmationPopUp`
- [ ] Loading via `CommonTable loading`; empty state with CTA; toast on actions

**Content**
- [ ] Placeholders are actions ("Enter name"), not sample values
- [ ] Copy sentence case, short; school vocabulary (student, class, section, term, fee, guardian)
- [ ] Stub data realistic (Indian names, classes "VII-B", ₹ amounts)

**Structure**
- [ ] Feature folder layout + named exports + `index.ts`; route, nav link, permission map all present
- [ ] No `fetch`, no `src/sdk` import, no logic in page that belongs in `hooks/` or `src/utils`

**Responsive & a11y**
- [ ] Works at 375 / 768 / 1280 (use Chrome tools or `bun dev` + devtools); no horizontal page scroll
- [ ] Every icon-only button has `aria-label`; focus rings visible; tap targets ≥ 40 px

**Gates**: `bun run lint && bun run test && bun run build` green.
