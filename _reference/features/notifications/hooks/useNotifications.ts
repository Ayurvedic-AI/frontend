import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAdminListNotificationsQueryOptions,
  getAdminListNotificationsQueryKey,
  getAdminNotificationUnreadCountQueryOptions,
  getAdminNotificationUnreadCountQueryKey,
  useAdminAcknowledgeNotification,
  useAdminDismissNotification,
  useAdminMarkAllNotificationsRead,
  useAdminMarkNotificationRead,
  type Envelope,
  type NotificationList,
  type UnreadCountOut,
} from '../api/notifications';

/** Poll cadence for the unread count + toast watcher — within the SC-001 30s budget. */
export const NOTIFICATION_POLL_MS = 25_000;

/** Unread + pending-acknowledgment counts, polled for the bell badge. */
export function useUnreadCount() {
  const query = useQuery(
    getAdminNotificationUnreadCountQueryOptions({
      query: { refetchInterval: NOTIFICATION_POLL_MS, refetchOnWindowFocus: true },
    }),
  );
  const data = (query.data as Envelope<UnreadCountOut> | undefined)?.data;
  return { ...query, data };
}

/** The notification list. `poll` keeps it fresh for the toast watcher even when
 *  the panel is closed. */
export function useNotificationsList(unreadOnly: boolean, opts: { poll?: boolean } = {}) {
  const query = useQuery(
    getAdminListNotificationsQueryOptions(
      { unread_only: unreadOnly, limit: 30 },
      { query: { refetchInterval: opts.poll ? NOTIFICATION_POLL_MS : false, refetchOnWindowFocus: true } },
    ),
  );
  const data = (query.data as Envelope<NotificationList> | undefined)?.data;
  return { ...query, data };
}

/** Read/mark-all/acknowledge/dismiss mutations (generated hooks); each refreshes
 *  the badge + lists on success. Mutate variables follow the generated shape:
 *  `{ notificationUuid }` (mark-read/ack/dismiss) and `void` (mark-all). */
export function useNotificationActions() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getAdminListNotificationsQueryKey() });
    qc.invalidateQueries({ queryKey: getAdminNotificationUnreadCountQueryKey() });
  };

  const markRead = useAdminMarkNotificationRead({ mutation: { onSuccess: invalidate } });
  const markAll = useAdminMarkAllNotificationsRead({ mutation: { onSuccess: invalidate } });
  const acknowledge = useAdminAcknowledgeNotification({ mutation: { onSuccess: invalidate } });
  const dismiss = useAdminDismissNotification({ mutation: { onSuccess: invalidate } });

  return { markRead, markAll, acknowledge, dismiss };
}
