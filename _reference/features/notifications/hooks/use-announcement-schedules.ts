import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAdminAnnouncementScheduleOccurrencesQueryOptions,
  getAdminGetAnnouncementScheduleQueryOptions,
  getAdminListAnnouncementSchedulesQueryOptions,
  useAdminCreateAnnouncementSchedule,
  useAdminUpdateAnnouncementSchedule,
} from '../api/announcement-schedules';
import type { AnnouncementScheduleList, AnnouncementScheduleOut } from '../api/announcement-schedules';
import {
  getAdminListAnnouncementsQueryKey,
  getAdminListNotificationsQueryKey,
  getAdminNotificationUnreadCountQueryKey,
  type AnnouncementList,
  type Envelope,
} from '../api/notifications';

/** All schedules (newest first); backend caps `limit` at 100. */
export function useAnnouncementSchedulesList() {
  const query = useQuery(getAdminListAnnouncementSchedulesQueryOptions({ limit: 100 }));
  const data = (query.data as Envelope<AnnouncementScheduleList> | undefined)?.data;
  return { ...query, data };
}

export function useAnnouncementSchedule(uuid: string | null) {
  const query = useQuery(
    getAdminGetAnnouncementScheduleQueryOptions(uuid ?? '', { query: { enabled: Boolean(uuid) } }),
  );
  const data = (query.data as Envelope<AnnouncementScheduleOut> | undefined)?.data;
  return { ...query, data };
}

export function useScheduleOccurrences(uuid: string | null) {
  const query = useQuery(
    getAdminAnnouncementScheduleOccurrencesQueryOptions(uuid ?? '', { limit: 100 }, {
      query: { enabled: Boolean(uuid) },
    }),
  );
  const data = (query.data as Envelope<AnnouncementList> | undefined)?.data;
  return { ...query, data };
}

/** Invalidate every schedule query (list/get/occurrences) + the notification
 *  surfaces an occurrence touches. */
function useScheduleInvalidation() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({
      predicate: (q) => {
        const k = q.queryKey?.[0];
        return typeof k === 'string' && k.includes('announcement-schedules');
      },
    });
    qc.invalidateQueries({ queryKey: getAdminListAnnouncementsQueryKey() });
    qc.invalidateQueries({ queryKey: getAdminListNotificationsQueryKey() });
    qc.invalidateQueries({ queryKey: getAdminNotificationUnreadCountQueryKey() });
  };
}

export function useCreateAnnouncementSchedule() {
  const invalidate = useScheduleInvalidation();
  return useAdminCreateAnnouncementSchedule({ mutation: { onSuccess: invalidate } });
}

export function useUpdateAnnouncementSchedule() {
  const invalidate = useScheduleInvalidation();
  return useAdminUpdateAnnouncementSchedule({ mutation: { onSuccess: invalidate } });
}
