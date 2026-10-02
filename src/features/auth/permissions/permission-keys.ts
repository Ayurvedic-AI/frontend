/**
 * Permission identifier types (feature 039).
 *
 * The runtime permission set delivered by the backend on `/auth/me` is the
 * single source of truth (FR-008). These types exist ONLY for editor ergonomics
 * and to keep the nav/route maps honest — they do NOT redefine the catalog.
 */

export type Action = 'view' | 'create' | 'update' | 'delete';

/** Catalog feature keys — mirror of the backend permission catalog (autocomplete aid only). */
export type Feature =
  | 'dashboard'
  | 'patients'
  | 'ai_summary'
  | 'students'
  | 'teachers'
  | 'classes'
  | 'attendance'
  | 'timetable'
  | 'fees'
  | 'exams'
  | 'users'
  | 'roles';

/** A `<feature>.<action>` permission string, e.g. `students.create`. */
export type Permission = `${Feature}.${Action}`;

/** Build a permission identifier from its parts. */
export const permissionName = (feature: Feature, action: Action): Permission =>
  `${feature}.${action}` as Permission;
