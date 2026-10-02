import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAdminAnnouncementRecipientsQueryOptions,
  getAdminListAnnouncementsQueryKey,
  getAdminListAnnouncementsQueryOptions,
  getAdminListNotificationsQueryKey,
  getAdminNotificationUnreadCountQueryKey,
  useAdminCreateAnnouncement,
  type AnnouncementList,
  type AnnouncementRecipientList,
  type Envelope,
} from '../api/notifications';

export function useAnnouncementsList() {
  // Load as many announcements as one request allows so client-side filtering +
  // pagination can reach every announcement (052 FR-016). The backend caps
  // `limit` at 100, so this is the max single-request load; it covers the
  // expected admin-sent volume. If the count ever exceeds 100, move to
  // server-side pagination (the list already returns `total`/`offset`) — note
  // there is no server-side severity filter, so that path must also filter
  // server-side or drop the in-page filter.
  const query = useQuery(getAdminListAnnouncementsQueryOptions({ limit: 100 }));
  const data = (query.data as Envelope<AnnouncementList> | undefined)?.data;
  return { ...query, data };
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useAdminCreateAnnouncement({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getAdminListAnnouncementsQueryKey() });
        qc.invalidateQueries({ queryKey: getAdminListNotificationsQueryKey() });
        qc.invalidateQueries({ queryKey: getAdminNotificationUnreadCountQueryKey() });
      },
    },
  });
}

export function useAnnouncementRecipients(uuid: string | null) {
  const query = useQuery(
    getAdminAnnouncementRecipientsQueryOptions(uuid ?? '', undefined, {
      query: { enabled: Boolean(uuid) },
    }),
  );
  const data = (query.data as Envelope<AnnouncementRecipientList> | undefined)?.data;
  return { ...query, data };
}
