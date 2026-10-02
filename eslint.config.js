import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores([
    'dist',
    'node_modules',
    'coverage',
    // Generated SDK (Orval) — only `src/sdk/mutator.ts` is hand-written and
    // it's small enough to spot-review. Linting auto-generated output is more
    // pain than signal; regenerating to satisfy a lint rule is the wrong gate.
    'src/sdk/**/*.ts',
    '!src/sdk/mutator.ts',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Constitution Principle I + II: no MUI / Emotion runtime in feature code.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@mui/*', '@mui/material', '@mui/icons-material', '@mui/system'],
              message:
                'MUI runtime is forbidden under the project constitution (Principle I). Use components from svm-fe/src/common/ styled with Tailwind.',
            },
            {
              group: ['@emotion/*'],
              message:
                'CSS-in-JS via Emotion is forbidden under the project constitution (Principle II). Use Tailwind utilities.',
            },
          ],
        },
      ],
    },
  },
  {
    // Feature-036 standard: feature code MUST integrate via the orval-generated
    // SDK (src/sdk/*), never the raw fetcher. Added as no-restricted-globals /
    // no-restricted-syntax (NOT no-restricted-imports) so the base MUI/Emotion
    // no-restricted-imports block above still applies to feature files. The
    // shared src/api/** is the sanctioned raw-HTTP layer (out of scope here);
    // src/sdk/** is globally ignored. Importing `ApiError` stays allowed.
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message:
            'Feature code must integrate via the generated SDK (src/sdk/*). For file downloads use src/api/download.ts. (feature 036)',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "ImportSpecifier[imported.name=/^(apiFetch|apiFetchWithMeta)$/]",
          message:
            'Feature code must use the generated SDK (src/sdk/*), not the raw fetcher (apiFetch/apiFetchWithMeta). Importing `ApiError` for error handling is allowed. (feature 036)',
        },
      ],
    },
  },
]);
