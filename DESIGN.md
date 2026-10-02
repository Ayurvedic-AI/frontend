# Ayurveda AI — Design System

Everything visual is defined once in `src/index.css` (`@theme`). Components in `src/common/` consume
those tokens. Screens compose components. This file is the human-readable contract.

## 1. Color

| Token (Tailwind class) | Hex | Use |
|---|---|---|
| `primary` / `primary-foreground` | `#2E7040` / `#FFFFFF` | primary buttons, active nav item, links, focus ring |
| `primary-00` … `primary-10` | `#F0F7F1` → `#0E2214` | tints (00–03) for selected rows/badges, shades (07–10) for gradients & hover |
| `secondary` / `secondary-foreground` | `#F0F7F1` / `#1A3B24` | secondary buttons, outline-button hover |
| `accent` (+ `accent-05` … `accent-90`) | `#F59E0B` | highlights, "new" badges, brand gradient end. Sparingly. |
| `background` / `foreground` | `#FFFFFF` / `#1C1917` | page canvas, body text |
| `card` / `card-foreground` | `#FFFFFF` / `#1C1917` | cards, dialogs, drawers |
| `muted` / `muted-foreground` | `#F5F5F4` / `#78716C` | subtle backgrounds, helper & secondary text |
| `border` / `input` / `ring` | `#E7E5E4` / `#D6D3D1` / `#2E7040` | dividers, field borders, focus ring |
| `neutral-00` … `neutral-90` | stone `#FAFAF9` → `#0C0A09` | text levels, table headers, disabled states |
| `positive` (+`-01`,`-05`,`-50`,`-60`,`-70`) | `#16A34A` | present, paid, active |
| `warning` (+`-01`,`-05`,`-50`,`-60`) | `#D97706` | pending, due soon, late |
| `info` (+`-01`,`-05`,`-50`,`-60`) | `#0284C7` | informational banners, "on leave" |
| `destructive` (+`-01` … `-70`) | `#DC2626` | errors, delete, absent, overdue |

Rules
- Status pill = `bg-<status>-01 text-<status>-70` (light tint + dark text). Never solid status fills in tables.
- Safety pill (allergies) = `bg-destructive-01 text-destructive-70 rounded-full text-xs font-medium`, one pill per fact, wrapping, never truncated. An empty list reads quietly (`text-xs text-muted-foreground`, "None recorded").
- Brand color lives in actions and navigation; content surfaces stay white/stone.
- No raw hex in components. No Tailwind palette classes (`text-green-700`). Change a color → change `index.css` only.
- No dark mode yet (add tokens under `.dark` when requested).

## 2. Typography
Font: **Inter** (Google Fonts, loaded in `index.html`), fallback system-ui.

| Role | Class | Size / line |
|---|---|---|
| Page title | `text-2xl font-semibold` (`md:text-3xl` on auth) | 24/32 |
| Section title / card title | `text-lg font-semibold` | 18/28 |
| Table header | `text-xs font-medium uppercase tracking-wide text-muted-foreground` | 12/16 |
| Body / form fields | `text-sm` | 14/20 |
| Helper, captions, hints | `text-xs text-muted-foreground` | 12/16 |
| Stat value | `text-3xl font-semibold` | 30/36 |

Weights: 400 body, 500 labels/buttons, 600 headings. Never 700 except stat values if needed.

## 3. Spacing, radius, elevation
- 4 px grid (Tailwind defaults). Page padding `p-4 md:p-6`. Card padding `p-5`. Form field gap `mb-4`.
- Radius: `rounded-md` (8 px) controls & inputs, `rounded-lg` (12 px) cards/drawers, `rounded-full` avatars/pills.
- Borders over shadows: cards are `border border-border bg-card`. Shadows only for floating layers (menus, popovers, drawers) — the components already do this.
- No sidebar: navigation lives in the top header (64 px, `h-16`); below `md` it opens a left drawer.

## 4. Screen anatomy (every list/management screen)
```
┌ TopHeader (brand · nav links · user menu; below md: menu → left drawer) ──┐
│ Page header:  Title (text-2xl)            [Secondary]  [+ Primary action] │
│               one-line description (text-sm muted)                        │
│ Toolbar:      [tabs / count]                    [Search…] [Filter ▾] [⋯]  │  ← search + filters top-right
│ CommonTable   sticky header · row hover · status pills · row ActionMenu   │
│               loading → TableSkeleton · empty → icon + "No patients yet" + CTA │
│ Pagination    bottom-right                                                │
└───────────────────────────────────────────────────────────────────────────┘
Create / Edit  → CustomDrawer anchor="right" (half width), RHF form, footer [Cancel] [Save]
View details   → same drawer, read-only, or ?view=<id> deep link
Delete / risky → ConfirmationPopUp (never inline)
Success/error  → toast() from common-snackbar, top-right (phones: offset 72 px to clear the header)
```
Register rows: the primary cell carries the name (`font-medium text-foreground`, truncates) plus a muted
`text-xs tabular-nums` sub-line of identifiers (e.g. Reg. No. · phone), so those need no columns of their own.
IDs, ages, dates and counts use `tabular-nums`. The row ActionMenu column is sticky right with opaque fills
matching the thead and row hover (handled by `CommonTable`).
Auth screens use `features/auth/components/AuthLayout` (brand panel left, form right, max-w 520).
Dashboards: stat cards grid `sm:grid-cols-2 xl:grid-cols-4`, then charts (recharts) in cards.

## 5. Component map — need → use
| Need | Component (`src/common/…`) |
|---|---|
| Button, icon button, loading button | `custom-buttons` → `CustomButton` variants primary/secondary/outline/ghost/destructive/success/icon |
| Text, password, number, textarea | RHF: `rhf-wrappers` → `RHFInput`, `RHFTextarea` (own `label` + `required`) |
| Select, multiselect, autocomplete | `RHFSelect`, `RHFMultiselect`, `RHFAutocomplete`, `RHFAutocompleteMultiselect` |
| Checkbox, radio, date, time, file | `RHFCheckbox`, `RHFRadioGroup`, `RHFDatePicker`, `RHFTimePicker`, `RHFFileUpload` |
| Phone with country code, address block | `RHFCountryCode`, `address-fields` |
| Search box | `custom-search` → `CustomSearchFilter` |
| Table | `common-table` → `CommonTable` (+ `TableSkeleton`, `pagination`) |
| Row / card actions menu | `action-menu` |
| Drawer, dialog, confirm | `custom-drawer`, `custom-dialog`, `confirmation-pop-up` |
| Toast | `common-snackbar` → `toast()` / `useToast()` |
| Avatar | `user-avatar` |
| Brand | `brand-logo` → `BrandLogo` |
| Label outside RHF | `custom-label` (never next to an RHF wrapper) |
| Print (report cards, receipts) | `print-preview` |

Icons: `lucide-react`, `size-4` inline, `size-[18px]` nav, `size-5` header actions.

## 6. States every screen must show in the mockup
Loading (skeleton), empty (illustrative icon + message + primary CTA), error (toast), and the
populated state with realistic *stub* data (names, Reg. Nos., dates) so the client can judge density.

## 7. Responsive
Mobile-first. Breakpoints: `sm` 640, `md` 768 (top nav links appear), `lg` 1024, `xl` 1280.
Tables scroll horizontally inside their container below `md`; toolbars stack (`flex-col sm:flex-row`).
Secondary columns may hide below `md` via column `meta.className` (`'hidden md:table-cell'`); a hidden column
that carries safety facts moves its content under the primary cell (`md:hidden`), never dropped or clipped.
Minimum tap target 40 px (`size-10` / `h-10`).

## 8. Do / Don't
- Do reuse a `_reference/` pattern (e.g. a list page with drawer) by re-creating it with Ayurveda AI data.
- Do keep copy short, sentence case ("Add patient", not "ADD NEW PATIENT").
- Don't invent one-off components, colors, spacings, or shadows.
- Don't put business logic in pages; hooks in `features/<x>/hooks`, helpers in `src/utils`.
