import { useInfiniteQuery } from '@tanstack/react-query';
import {
  adminListNotifications,
  getAdminListNotificationsQueryKey,
} from '../api/notifications';
import type { Envelope, NotificationList, NotificationOut } from '../api/notifications';

/** Page size for the full-page feed — the backend caps `limit` at 100 (research D1). */
export const NOTIFICATION_PAGE_SIZE = 50;

type Page = Envelope<NotificationList>;

/**
 * Infinite-scroll source for the full notifications page (feature 053 US1). Wraps
 * the orval-generated `adminListNotifications` fetcher in `useInfiniteQuery`,
 * deriving the next offset from `total`/`offset` so every notification stays
 * reachable with no hard cap.
 */
export function useNotificationsInfinite(unreadOnly: boolean) {
  const query = useInfiniteQuery({
    queryKey: [
      ...getAdminListNotificationsQueryKey({ unread_only: unreadOnly, limit: NOTIFICATION_PAGE_SIZE }),
      'infinite',
    ],
    queryFn: async ({ pageParam }) => {
      const res = await adminListNotifications({
        unread_only: unreadOnly,
        limit: NOTIFICATION_PAGE_SIZE,
        offset: pageParam,
      });
      return res as unknown as Page;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const { offset, items, total } = lastPage.data;
      const loaded = offset + items.length;
      return loaded < total ? loaded : undefined;
    },
    refetchOnWindowFocus: true,
  });

  const pages = query.data?.pages ?? [];
  const items: NotificationOut[] = pages.flatMap((p) => p.data.items);
  const total = pages.length ? pages[pages.length - 1].data.total : 0;

  return { ...query, items, total };
}
