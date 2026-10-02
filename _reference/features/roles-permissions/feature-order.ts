/**
 * Order the permission-matrix feature rows to match the left sidebar (#110).
 *
 * The backend permission catalog returns features in its own (seed) order, which
 * doesn't line up with the sidebar a user navigates by. This reorders the rows
 * to the sidebar's top-to-bottom order so the grid reads the same way.
 *
 * Keys are the `FeatureRow.feature` values from the backend catalog. Grid
 * features without a sidebar item (Category/Store Types live under Masters) are
 * slotted where they belong. Any feature not listed keeps its original position
 * at the end, so a newly-added backend feature is never dropped.
 *
 * Feature 068 realigned the catalog to the app's actual UI surface: exactly the
 * 19 live feature keys below, in sidebar order (processing / manufacturing /
 * dispatch_checklist / notifications rows were removed with their modules; the
 * old `dispatch` placeholder is gone too).
 */
const SIDEBAR_FEATURE_ORDER: string[] = [
  'dashboard',
  'inventory',
  'production', // Production Pipeline (covers /manufacturing queue + pipeline board)
  'sales',
  'purchasing',
  'returns',
  'payments',
  'crm',
  'crm_phone', // field-level lead-phone reveal, lives with CRM
  'message_templates',
  'follow_ups',
  'reports',
  'masters',
  'category_types',
  'store_types',
  'users',
  'roles',
  'announcements',
  'activity_log',
];

function rank(feature: string): number {
  const i = SIDEBAR_FEATURE_ORDER.indexOf(feature);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
}

/** Return a new array of feature rows ordered to match the sidebar. */
export function orderFeaturesBySidebar<T extends { feature: string }>(rows: T[]): T[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => rank(a.row.feature) - rank(b.row.feature) || a.index - b.index)
    .map(({ row }) => row);
}
