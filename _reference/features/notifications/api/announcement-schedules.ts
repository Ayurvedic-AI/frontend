// Data access for recurring announcement schedules (backend feature 053,
// /admin/notifications/announcement-schedules, "Notifications" tag).
//
// Thin re-export of the orval-generated SDK (`src/sdk/notifications.ts`) — no
// hand-written HTTP. Mirrors `api/notifications.ts`.
export {
  getAdminListAnnouncementSchedulesQueryOptions,
  getAdminListAnnouncementSchedulesQueryKey,
  getAdminGetAnnouncementScheduleQueryOptions,
  getAdminGetAnnouncementScheduleQueryKey,
  getAdminAnnouncementScheduleOccurrencesQueryOptions,
  getAdminAnnouncementScheduleOccurrencesQueryKey,
  useAdminCreateAnnouncementSchedule,
  useAdminUpdateAnnouncementSchedule,
} from '../../../sdk/notifications';

export { ScheduleStatusUpdateAction } from '../../../sdk/schemas';

export type {
  AnnouncementScheduleCreate,
  AnnouncementScheduleOut,
  AnnouncementScheduleList,
  ScheduleStatusUpdate,
} from '../../../sdk/schemas';
