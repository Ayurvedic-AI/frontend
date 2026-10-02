---
name: Ayurveda AI
description: Consultation assistant for a solo vaidya; verdigris teal and copper, Ayurvedic but modern.
colors:
  page: "#FBFAF7"
  background: "#FFFFFF"
  card: "#FFFFFF"
  foreground: "#17181F"
  shell: "#0E4F55"
  shell-foreground: "#E6F0EF"
  shell-muted: "#9CC3C1"
  primary: "#12676E"
  primary-foreground: "#FFFFFF"
  primary-00: "#EEF6F5"
  primary-02: "#B2D8D5"
  primary-07: "#0F5960"
  primary-08: "#0E4F55"
  secondary: "#EEF6F5"
  secondary-foreground: "#0B3D42"
  accent: "#B8662E"
  accent-30: "#D99D6E"
  muted: "#F3F1EC"
  muted-foreground: "#5E5A54"
  border: "#E6E2DA"
  input: "#CFC9BE"
  ring: "#12676E"
  neutral-30: "#A9A39A"
  neutral-70: "#2E2C29"
  destructive: "#C62828"
  destructive-01: "#FDF2F2"
  destructive-10: "#F5C2C2"
  destructive-60: "#A61F1F"
  destructive-70: "#8A1A1A"
  warning: "#C27C0E"
  warning-01: "#FEF8E7"
  warning-05: "#FCEDC2"
  warning-60: "#8F5B08"
  positive: "#2E7D32"
  positive-01: "#EFF7EF"
  positive-70: "#1B5E20"
  info: "#1F6FA8"
  info-01: "#EEF5FB"
  info-60: "#17557F"
typography:
  page-title:
    fontFamily: "Mukta, Noto Sans Devanagari, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
  page-title-md:
    fontFamily: "Mukta, Noto Sans Devanagari, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.25
  section-title:
    fontFamily: "Mukta, Noto Sans Devanagari, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: "1.75rem"
  nav:
    fontFamily: "Mukta, Noto Sans Devanagari, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 500
    lineHeight: "1.5rem"
  body:
    fontFamily: "Mukta, Noto Sans Devanagari, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: "1.375rem"
  label:
    fontFamily: "Mukta, Noto Sans Devanagari, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: "1.125rem"
  table-header:
    fontFamily: "Mukta, Noto Sans Devanagari, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: "1.125rem"
    letterSpacing: "0.025em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  page-mobile: "16px"
  page: "24px"
  card: "20px"
  stack: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 16px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 16px"
  button-outline-hover:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    height: "40px"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 12px"
  top-header:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-foreground}"
    height: "64px"
  nav-item-active-bar:
    backgroundColor: "{colors.accent-30}"
    height: "3px"
  page-title-bar:
    backgroundColor: "{colors.accent}"
    rounded: "{rounded.full}"
    height: "3px"
    width: "32px"
  section-title-bar:
    backgroundColor: "{colors.accent}"
    rounded: "{rounded.full}"
    height: "3px"
    width: "24px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "20px"
  allergy-pill:
    backgroundColor: "{colors.warning-01}"
    textColor: "{colors.warning-60}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  red-flag-banner:
    backgroundColor: "{colors.destructive-01}"
    textColor: "{colors.destructive-70}"
    rounded: "{rounded.lg}"
    padding: "16px"
  table-head:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.table-header}"
---

# Design System: Ayurveda AI

Everything visual is defined once in `src/index.css` (`@theme`). Components in `src/common/` consume
those tokens; screens compose components. The frontmatter above is normative; this prose says where
and why. Change a value in `index.css`, then here.

## 1. Overview

**Creative North Star: "The Copper Vessel and Its Patina"**

A deep verdigris teal holds the shell and every action, the way patina holds an old copper lota; a thin
copper bar marks where you are. The world is Ayurvedic in material (teal, copper, warm white, an amphora
mark) and modern in behaviour: flat, bordered, dense enough for a register, and read at a glance
mid-consultation in a daylit clinic.

The screen is built in three layers: a full-width teal band at the top (brand, nav, user), a warm-white
page canvas, and white bordered cards that carry the work. Colour is spent on actions and orientation,
never on content surfaces. Red is held back so that when it appears it means a red flag or an error.
The world refuses generic wellness green and grey SaaS with one blue accent.

**Key Characteristics:**
- Deep teal band (64px) as the top bar; no sidebar.
- Teal for buttons, links, focus rings, selection and selected tints.
- A 3px copper bar that marks the current place and nothing else.
- Warm-white page, white cards, warm hairlines, near-black ink.
- Mukta for Latin and Devanagari together; body steps up to 15px.
- Borders over shadows; shadows only on floating layers.

## 2. Colors

A two-metal palette, teal patina and copper, over warm paper neutrals, with status colours kept strictly
to their meaning.

### Primary
- **Verdigris Teal** (`primary`): primary buttons, links, focus ring (`ring`), the brand mark tile,
  the active row in the mobile drawer (`primary-00` fill, `primary-07` text). Full ramp `primary-00`
  to `primary-10` lives in `index.css`.
- **Deep Verdigris Band** (`shell`, same value as `primary-08`): the top header and the login brand
  panel. Text on it is `shell-foreground`; secondary text and the user-menu chevron are `shell-muted`.
- **Patina Wash** (`secondary` / `primary-00`): outline and ghost button hover, menu item highlight,
  table head fill, row hover, list-row hover on the dashboard.
- **Selection Teal** (`primary-02`): `::selection` background with ink text.

### Secondary
- **Copper** (`accent`): the "you are here" bar above page titles, under the active mobile nav label,
  and above summary section headings. Ramp `accent-05` to `accent-90` exists; only `accent` and
  `accent-30` are in use.
- **Pale Copper** (`accent-30`): the active nav bar on the teal band, where `accent` itself lacks
  contrast. The favicon's amphora stroke uses `accent-20`.

### Neutral
- **Warm White Page** (`page` = `neutral-00`): the body canvas behind cards.
- **White Surface** (`background`, `card`): cards, tables, inputs, drawers, menus, dialogs.
- **Ink** (`foreground` = `neutral-80`): headings and body text.
- **Warm Label Grey** (`muted-foreground` = `neutral-50`): helper text, sub-lines, table headers,
  empty values. 6.6:1 on white, 6.3:1 on the page.
- **Warm Hairline** (`border` = `neutral-10`): card, table and divider borders; `input` is the
  slightly darker field stroke. `muted` is the quiet fill for empty-section notes and skeletons.
- `neutral-30` for disclosure chevrons; `neutral-70` for inactive mobile-drawer items.

### Status
- **Red** (`destructive`, ramp `-01` to `-70`): red flags, errors, delete. Nothing else.
- **Amber** (`warning`, `-01`, `-05`, `-50`, `-60`): caution, including allergies.
- **Green** (`positive`): success and the "no red flags" check.
- **Blue** (`info`): informational banners.
- Status pill = `bg-<status>-01 text-<status>-60/70` (light tint, dark text). Never solid status fills
  in tables.

### Named Rules
**The Copper Bar Rule.** Copper marks the current place only: the active nav item, the page title, and
summary section heads, as a 3px bar. Never a fill, pill, badge, border, icon or text colour.

**The Band Contrast Rule.** On the teal band, copper is `accent-30`, not `accent`. Anything light on
the band uses `shell-foreground`, `shell-muted` or white.

**The Reserved Red Rule.** Red appears only for red flags and errors (and destructive actions). If a
screen shows red, something needs the vaidya's attention.

**The Paper and Card Rule.** The page canvas is `bg-page` warm white; every working surface
(`bg-background`, `bg-card`) is pure white on top of it. Never put content directly on a tinted fill.

**The Tokens Only Rule.** No raw hex, no Tailwind palette classes (`text-green-700`), no inline colours
in components. A colour change happens in `index.css` only. No dark mode yet.

## 3. Typography

**Font:** Mukta (Google Fonts, 400/500/600/700, loaded in `index.html`), fallback Noto Sans Devanagari,
system-ui. **Mono:** ui-monospace stack.

**Character:** One humanist family that sets English, Hindi and Marathi with the same voice and
weight, so mixed-script consultation text never switches face mid-line.

### Hierarchy
The scale is shifted up from Tailwind defaults because Mukta's Latin runs small:
`text-xs` 13/18, `text-sm` 15/22, `text-base` 17/24, `text-lg` 18/28, `text-2xl` 24/32, `text-3xl` 30/36.

- **Page title** (600, `text-2xl`, `md:text-3xl`, tight leading): one per screen, inside `PageHeader`.
- **Section title** (600, `text-lg`): card and summary section headings, dashboard panel heads.
- **Nav** (500, `text-base`; 600 when active): top-bar links.
- **Body** (400, `text-sm`): tables, form fields, list rows, descriptions.
- **Label / helper** (400, `text-xs`, muted): sub-lines, hints, captions, "None recorded".
- **Table header** (600, `text-xs`, uppercase, `tracking-wide`, muted): column heads in `CommonTable` only.
- **Brand wordmark** (600, `tracking-tight`): `BrandLogo` only.

Weights: 400 body, 500 labels, buttons and names, 600 headings and active nav. 700 is loaded but unused.

### Named Rules
**The One Voice Rule.** Mukta for Latin and Devanagari together; never introduce a second family or a
separate Devanagari face for display.

**The Sentence Case Rule.** All UI copy is sentence case ("Add patient", "AI summary"). Uppercase is
reserved for table column headers.

**The Tabular Figures Rule.** IDs, Reg. Nos., ages, times, dates and counts use `tabular-nums`.

## 4. Layout

Top nav, no sidebar. Page content sits in `mx-auto max-w-7xl p-4 md:p-6` on the warm-white page.
4px grid (Tailwind defaults). `PageHeader` has `mb-6`; card padding is `p-5`; grid gaps are `gap-6`;
form field gap `mb-4`.

### Screen anatomy (every list/management screen)
```
┌ TopHeader: teal band, 64px · brand · nav links (copper bar on active) · user menu ┐
│           below md: menu button → left drawer                                     │
│ PageHeader:  ▬ copper bar                                                          │
│              Title (text-2xl / md:text-3xl)            [Secondary] [+ Primary]     │
│              one-line description or live count (text-sm muted)                    │
│ Toolbar:     [tabs / count]                  [Search…] [Filter ▾] [Filter ▾]       │  ← top-right
│ CommonTable  white, bordered · patina head · row hover · pills · sticky ActionMenu │
│              loading → TableSkeleton · empty → icon + message + CTA                │
│ Pagination   bottom-right, inside the table card                                   │
└────────────────────────────────────────────────────────────────────────────────────┘
Create / Edit  → CustomDrawer anchor="right" (half width), RHF form, footer [Cancel] [Save]
View details   → same drawer, read-only, or ?view=<id> deep link
Delete / risky → ConfirmationPopUp (never inline)
Success/error  → toast() from common-snackbar, top-right (phones: offset 72px to clear the header)
```
Register rows: the primary cell carries the name (`font-medium text-foreground`, truncates) plus a muted
`text-xs tabular-nums` sub-line of identifiers (Reg. No. · phone), so those need no columns of their own.
The row ActionMenu column is sticky right with opaque fills that match the thead and row hover
(`color-mix` of `secondary` into `background`, handled by `CommonTable`).

Auth screens use `features/auth/components/AuthLayout`: teal brand panel left, warm-white form side right.
Dashboard: `PageHeader` with date and a live count link, then a two-panel grid
(`lg:grid-cols-[3fr_2fr]`): today's consultations and needs attention, each a bordered white panel with
a bordered head and divided link rows.

### States every screen must show
Loading (skeleton or quiet "Loading…"), empty (icon or quiet muted line + primary CTA where one exists),
error (toast), and the populated state with realistic stub data (names, Reg. Nos., dates) so the client
can judge density.

### Responsive
Mobile-first. Breakpoints: `sm` 640, `md` 768 (top nav links appear in the band), `lg` 1024, `xl` 1280.
Every screen works at 375, 768 and 1280. Tables scroll horizontally inside their container below `md`;
toolbars and page-header actions stack (`flex-col sm:flex-row`). Secondary columns may hide below `md`
via column `meta.className` (`'hidden md:table-cell'`); a hidden column that carries safety facts moves
its content under the primary cell (`md:hidden`), never dropped or clipped. Minimum tap target 40px.

## 5. Elevation & Depth

Flat by default. Depth comes from the three tonal layers (teal band, warm-white page, white card) and
warm 1px hairlines, not shadows.

### Shadow Vocabulary
- **Floating layer** (`shadow-lg`): dropdown menus, popovers, drawers, dialogs. The components already
  apply it.
- **Sticky column edge** (`box-shadow: -6px 0 6px -6px rgba(0,0,0,0.08)`): the pinned actions column in
  `CommonTable` only.

### Named Rules
**The Borders Over Shadows Rule.** Cards and panels are `border border-border bg-card` with no shadow.
Shadows belong to things that float above the page.

## 6. Shapes

Gently rounded, never pill-shaped controls. `rounded-md` (8px) for buttons, inputs, menu items and the
small brand tile; `rounded-lg` (12px) for cards, tables, banners, drawers and menus; `rounded-full` for
avatars, status and allergy pills, and the copper bars. The amphora (lucide `Amphora`) in a rounded tile
is the brand mark; the favicon repeats it as a pale copper stroke on the band teal.

## 7. Components

Calm and exact: teal fills for the one action that matters, white bordered surfaces for everything else.

### Component map (need → use)
| Need | Component (`src/common/…`) |
|---|---|
| Button, icon button, loading button | `custom-buttons` → `CustomButton` variants primary/secondary/outline/ghost/destructive/success/icon |
| Text, password, number, textarea | `rhf-wrappers` → `RHFInput`, `RHFTextarea` (own `label` + `required`) |
| Select, multiselect, autocomplete | `RHFSelect`, `RHFMultiselect`, `RHFAutocomplete`, `RHFAutocompleteMultiselect` |
| Checkbox, radio, date, time, file | `RHFCheckbox`, `RHFRadioGroup`, `RHFDatePicker`, `RHFTimePicker`, `RHFFileUpload` |
| Phone with country code, address block | `RHFCountryCode`, `address-fields` |
| Page title block | `page-header` → `PageHeader` (title, description, actions; carries the copper bar) |
| Search box | `custom-search` → `CustomSearchFilter` |
| Table | `common-table` → `CommonTable` (+ `TableSkeleton`, `pagination`) |
| Row / card actions menu | `action-menu` |
| Drawer, dialog, confirm | `custom-drawer`, `custom-dialog`, `confirmation-pop-up` |
| Toast | `common-snackbar` → `toast()` / `useToast()` |
| Avatar | `user-avatar` |
| Brand | `brand-logo` → `BrandLogo` (`inverted` on the band) |
| Label outside RHF | `custom-label` (never next to an RHF wrapper) |
| Print (reports, receipts) | `print-preview` |

Icons: `lucide-react`, `size-4` inline, `size-[18px]` nav, `size-5` header actions and banners.
Common components only: never a native `<input>/<select>/<button>` in a feature.

### Buttons
- **Shape:** gently rounded (8px); `sm` 36px, `md` 40px, `lg` 48px tall.
- **Primary:** teal fill, white text, weight 500; hover 90% teal. One per screen region.
- **Outline:** white with `input` stroke and ink text; hover to patina wash with deep-teal text.
- **Ghost / icon:** transparent, patina wash on hover.
- **Destructive:** red fill, for confirmed deletes only.
- **Focus:** 2px ring in `ring` at 50%.

### Inputs / Fields
- **Style:** 44px tall, white, `input` stroke, 8px radius, 12px side padding, muted placeholder;
  placeholders are actions ("Enter email"), never sample values.
- **Focus:** border turns teal plus a 2px teal ring at 40%.
- **Error / disabled:** red border and red ring; disabled is a patina wash at 60% and 70% opacity.

### Cards / Containers
- **Corner:** 12px. **Background:** white on the warm page. **Border:** `border`. **Shadow:** none.
- **Padding:** 20px; panels with a bordered head use `px-5 py-4` for the head.

### Tables
White, bordered, 12px corners. Head is the patina wash with muted uppercase `text-xs` labels; rows divide
with a hairline and wash on hover. The actions column is sticky right with opaque fills.

### Navigation
- **Top header:** the teal band, 64px, sticky. Links are `shell-foreground` at 85%, weight 500, with an
  18px icon; hover washes white at 10%. Active is white, weight 600, with a 3px `accent-30` bar on the
  band's bottom edge.
- **Mobile drawer:** opens left at 80vw on white. Active row is the `primary-00` wash with `primary-07`
  text and a 3px copper bar under the label.
- **User menu:** the avatar sits as an opaque `primary-00` disc with `primary-08` initials (the soft
  10% tint vanishes on teal); menu is a white floating layer.

### Copper bar (signature)
A 3px rounded copper rule: 32px wide above the page title, 24px above a summary section heading,
label-wide under the active mobile nav item, item-wide along the band edge for the active nav link.

### Allergy pill
Amber caution pill: `warning-01` fill, `warning-60` text, `warning-05` inset ring, `text-xs` 500, a 12px
drawn `TriangleAlert` icon. One pill per allergy, wrapping, never truncated. An empty list reads quietly
in muted `text-xs`: "None recorded".

### Red flag banner
`role="alert"`, 12px corners, `destructive-01` fill, `destructive-10` border, `destructive-70` text,
20px `TriangleAlert`, semibold "Red flags: …" line and optional advice below. Shown above everything on
the summary; never collapsible. In lists, a red flag is a `destructive-01` / `destructive-70` pill.

## 8. Do's and Don'ts

### Do:
- **Do** use the copper bar only through `PageHeader`, `SummarySection` and the nav components.
- **Do** use `accent-30` for copper on the teal band.
- **Do** show allergies as amber caution pills with the drawn alert icon.
- **Do** keep content on white cards over the `bg-page` canvas.
- **Do** use `tabular-nums` for IDs, ages, times, dates and counts.
- **Do** keep copy short and sentence case ("Add patient", not "ADD NEW PATIENT").
- **Do** reuse a `_reference/` pattern (e.g. a list page with drawer) by re-creating it with Ayurveda AI data.

### Don't:
- **Don't** use copper as a fill, pill, badge, border or text colour.
- **Don't** use red for anything but red flags, errors and delete.
- **Don't** use the bar shape or copper for warnings; warnings stay amber tint pills.
- **Don't** put shadows on cards or panels.
- **Don't** invent one-off components, colours, spacings or shadows; no raw hex or palette classes.
- **Don't** put business logic in pages; hooks in `features/<x>/hooks`, helpers in `src/utils`.
