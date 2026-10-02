// Data access for the Notifications feature (backend feature 035,
// /admin/notifications, "Notifications" tag).
//
// Per the feature-036 standard, this is a THIN wrapper over the orval-generated
// SDK (`src/sdk/notifications.ts`) — it re-exports the generated query-option
// factories, query-key factories, and mutation hooks plus the generated schema
// types. There is NO hand-written HTTP here (no `apiFetch`/`fetch`). Mirrors the
// `payments/api/payments.ts` pattern.
export {
  adminListNotifications,
  getAdminListNotificationsQueryOptions,
  getAdminListNotificationsQueryKey,
  getAdminNotificationUnreadCountQueryOptions,
  getAdminNotificationUnreadCountQueryKey,
  getAdminListAnnouncementsQueryOptions,
  getAdminListAnnouncementsQueryKey,
  getAdminAnnouncementRecipientsQueryOptions,
  useAdminMarkNotificationRead,
  useAdminMarkAllNotificationsRead,
  useAdminAcknowledgeNotification,
  useAdminDismissNotification,
  useAdminCreateAnnouncement,
} from '../../../sdk/notifications';

import type { NotificationOut, AnnouncementCreate } from '../../../sdk/schemas';

export type {
  NotificationOut,
  NotificationList,
  UnreadCountOut,
  MarkAllResult,
  DismissResult,
  AnnouncementOut,
  AnnouncementList,
  AnnouncementRecipientList,
  AnnouncementRecipientOut,
  AnnouncementCreate,
} from '../../../sdk/schemas';

/** Derived from the generated schema so the union never drifts from the contract. */
export type Severity = NotificationOut['severity'];
export type AudiencePayload = AnnouncementCreate['audience'];

/** The SDK mutator wraps every response as `{ data, status, headers }`. */
export interface Envelope<T> {
  data: T;
  status: number;
}
