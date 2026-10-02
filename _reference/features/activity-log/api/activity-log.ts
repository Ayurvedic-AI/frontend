// Data access for the Activity Log feature. Single entry point onto the
// generated SDK (`adminListActivityLog`).
import { getAdminListActivityLogQueryOptions } from '../../../sdk/activity-log';
import type {
  ActivityLogListItem,
  ActivityLogList,
  AdminListActivityLogParams,
} from '../../../sdk/schemas';

export type AuditRow = ActivityLogListItem;
// Keep the feature's public type name stable for consumers (useActivityLog).
export type AuditLogListResponse = ActivityLogList;

/**
 * TanStack Query options for `GET /api/v1/admin/activity-log`.
 *
 * The endpoint has no free-text search param (it supports action/entity/actor/date
 * filters); the page's search box is applied client-side in `useActivityLog`.
 * Pagination (`limit`/`offset`) IS handled server-side.
 */
export function activityLogQueryOptions(params?: AdminListActivityLogParams) {
  return getAdminListActivityLogQueryOptions(params);
}
