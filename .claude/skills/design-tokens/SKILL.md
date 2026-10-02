---
name: design-tokens
description: Change or extend the School ERP design tokens (brand color, palette, font, radius) safely. Use when asked to change colors, theme, branding, typography, or to add a new semantic color.
---

# Design tokens

Single source of truth: `src/index.css` → `@theme { … }`. Tailwind v4 turns every
`--color-x` into `bg-x / text-x / border-x / ring-x`. Human doc: `DESIGN.md §1–3`.

## Change the brand color
1. Replace `--color-primary` and regenerate the `primary-00 … primary-10` scale (00 lightest tint →
   10 darkest shade; keep 06 == primary). Use a 11-step scale from Tailwind's palette when possible.
2. Set `--color-ring` = primary, `--color-secondary` = primary-00, `--color-secondary-foreground` = primary-09.
3. Update the hex table in `DESIGN.md §1` and `public/favicon.svg` fill.
4. Verify at `http://localhost:5173/#__component-library` and on `/login` + `/dashboard`.

## Add a semantic color (e.g. `--color-highlight`)
Add `--color-highlight`, `-foreground`, and at least `-01`, `-05`, `-50`, `-60`, `-70` steps so pills
(`bg-highlight-01 text-highlight-70`) and solid fills both work. Document it in `DESIGN.md`.

## Change the font
Edit `--font-sans` and the Google Fonts `<link>` in `index.html`. Keep weights 400/500/600/700.

## Guardrails
- Never hardcode colors in components. Check: `grep -rnE "#[0-9a-fA-F]{6}" src --include=*.tsx | grep -v index.css`
- Never add colors in `tailwind.config.ts`; it exists only for content paths.
- Run `bun run test` — `custom-buttons.test.tsx` asserts token classes.
