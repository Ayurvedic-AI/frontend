/**
 * Barrel export for the `src/common/` component library.
 *
 * Re-exports are added phase-by-phase as each user-story slice of the
 * MUI → Tailwind migration lands. See:
 *   - specs/001-mui-to-tailwind-migration/tasks.md
 *   - specs/001-mui-to-tailwind-migration/contracts/
 *
 * Until a component is migrated, its line stays commented out so consumers
 * importing from `@/common` don't pick up a half-broken legacy module.
 */

// Shared types
export type { BaseFormInputProps } from './types';

// ── Phase 3 / US1 — Core form fields (P1) ────────────────────────────────────
export * from './custom-label';
export * from './custom-input';
export * from './custom-text-area';
export * from './custom-select';
export * from './custom-checkbox';
export * from './custom-radio';
export * from './custom-buttons';
export * from './rhf-wrappers';

// ── Phase 4 / US2 — Advanced inputs (P2) ─────────────────────────────────────
export * from './custom-search';
export * from './custom-multiselect';
export * from './custom-auto-complete';
export * from './custom-autocomplete-multiselect';
export * from './country-code';
export * from './date-picker-field';
export * from './time-picker-field';
export * from './custom-fileupload';
export * from './brand-logo';
export * from './multiple-files-upload';
export * from './signature-canvas';

// ── Phase 5 / US3 — Overlays & feedback (P3) ─────────────────────────────────
export * from './custom-dialog';
export * from './custom-drawer';
export * from './common-snackbar';
export * from './confirmation-pop-up';
export * from './action-menu';

// ── Phase 6 / US4 — Data display (P4) ────────────────────────────────────────
export * from './pagination';
export * from './user-avatar';
export * from './common-table';
