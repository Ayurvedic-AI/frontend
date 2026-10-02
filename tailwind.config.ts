import type { Config } from 'tailwindcss';

/**
 * Tailwind v4 project config.
 *
 * Tailwind v4 reads design tokens from the `@theme` block in `src/index.css`
 * (preferred). This file is kept for explicit content paths and as the
 * canonical place to wire JS-driven theme extensions if we ever need them.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
} satisfies Config;
