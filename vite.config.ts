import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vite.dev/config/
export default defineConfig({
  // PREVIEW=1 inlines everything into one dist/index.html for client sharing
  // (see .claude/skills/share-design). Normal builds are unaffected.
  plugins: [react(), tailwindcss(), ...(process.env.PREVIEW ? [viteSingleFile()] : [])],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    css: true,
    exclude: ['**/node_modules/**', '_reference/**'],
  },
});
