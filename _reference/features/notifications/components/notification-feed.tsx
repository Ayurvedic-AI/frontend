import { useEffect, useRef, useState } from 'react';
import { BellOff, Loader2 } from 'lucide-react';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage } from '../../../utils/api-messages';
import type { NotificationOut } from '../api/notifications';
import { useNotificationActions } from '../hooks/useNotifications';
import { useNotificationsInfinite } from '../hooks/use-notifications-infinite';
import { bucketByRecency } from './notification-utils';
import { NotificationFeedItem } from './notification-feed-item';
import { NotificationGroup } from './notification-group';
import { NotificationDetailDrawer } from './notification-detail-drawer';

interface NotificationFeedProps {
  unreadOnly: boolean;
}

/**
 * The full-page notifications feed (feature 053 US1/US2): recency-grouped,
 * infinite-scrolling, with the standard per-item actions. Handles its own
 * loading / empty / error states so the page is a thin shell.
 */
export function NotificationFeed({ unreadOnly }: NotificationFeedProps) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<NotificationOut | null>(null);
  const { markRead, acknowledge, dismiss } = useNotificationActions();
  const { items, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNotificationsInfinite(unreadOnly);

  const busy = markRead.isPending || acknowledge.isPending || dismiss.isPending;

  // Auto-load the next page as the sentinel scrolls into view.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '200px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const onActivate = (item: NotificationOut) => {
    if (item.read_at === null) markRead.mutate({ notificationUuid: item.uuid });
    setSelected(item);
  };
  const onAcknowledge = (uuid: string) =>
    acknowledge.mutate(
      { notificationUuid: uuid },
      { onError: (e) => toast({ severity: 'error', message: errorMessage(e) }) },
    );
  const onDismiss = (uuid: string) =>
    dismiss.mutate(
      { notificationUuid: uuid },
      { onError: (e) => toast({ severity: 'error', message: errorMessage(e) }) },
    );

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" aria-hidden />
      </div>
    );
  }
  if (isError) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">Couldn&rsquo;t load notifications.</p>
    );
  }
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
        <BellOff className="size-8" aria-hidden />
        <p className="text-sm">You&rsquo;re all caught up.</p>
      </div>
    );
  }

  const groups = bucketByRecency(items);

  return (
    <>
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {groups.map((group) => (
        <NotificationGroup key={group.key} label={group.label}>
          {group.items.map((item) => (
            <NotificationFeedItem
              key={item.uuid}
              item={item}
              onActivate={onActivate}
              onAcknowledge={onAcknowledge}
              onDismiss={onDismiss}
              busy={busy}
            />
          ))}
        </NotificationGroup>
      ))}

      <div ref={sentinelRef} aria-hidden />

      {hasNextPage ? (
        <div className="flex justify-center border-t border-border p-3">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            {isFetchingNextPage && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : (
        <p className="border-t border-border py-3 text-center text-xs text-muted-foreground">
          You&rsquo;re all caught up.
        </p>
      )}
    </div>

      <NotificationDetailDrawer
        notification={selected}
        onClose={() => setSelected(null)}
        onAcknowledge={onAcknowledge}
        busy={busy}
      />
    </>
  );
}
