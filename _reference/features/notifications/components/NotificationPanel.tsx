import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BellOff, BellRing, CheckCheck, Loader2 } from 'lucide-react';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage } from '../../../utils/api-messages';
import type { NotificationOut } from '../api/notifications';
import { cn } from '../../../lib/cn';
import { useNotificationActions, useNotificationsList, useUnreadCount } from '../hooks/useNotifications';
import { usePushNotifications } from '../hooks/use-push-notifications';
import { NotificationFeedItem } from './notification-feed-item';
import { linkToPath } from './notification-utils';

/** The popover shows only a compact preview; the full history lives at /notifications. */
const PREVIEW_COUNT = 8;

interface NotificationPanelProps {
  onClose?: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data, isPending, isError } = useNotificationsList(unreadOnly);
  const { markRead, markAll, acknowledge, dismiss } = useNotificationActions();
  const push = usePushNotifications();

  const { data: counts } = useUnreadCount();
  const unread = counts?.unread_count ?? 0;

  const items = (data?.items ?? []).slice(0, PREVIEW_COUNT);
  const hasUnread = (data?.items ?? []).some((n) => n.read_at === null);
  const busy = markRead.isPending || markAll.isPending || acknowledge.isPending || dismiss.isPending;

  const onActivate = (item: NotificationOut) => {
    if (item.read_at === null) markRead.mutate({ notificationUuid: item.uuid });
    const path = linkToPath(item.link_entity_type, item.link_entity_uuid);
    if (path) {
      onClose?.();
      navigate(path);
    }
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

  return (
    <div
      className="flex max-h-[min(32rem,80vh)] w-[min(24rem,calc(100vw-1.5rem))] flex-col"
      data-slot="notification-panel"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
          {unread > 0 && (
            <span className="flex min-w-4 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-4 text-primary-foreground">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Browser push toggle (feature 069) — hidden where unsupported. */}
          {push.state !== 'unsupported' && (
            <button
              type="button"
              onClick={() => (push.state === 'enabled' ? void push.disable() : void push.enable())}
              disabled={push.state === 'busy' || push.state === 'blocked'}
              aria-label={
                push.state === 'enabled'
                  ? 'Disable browser notifications'
                  : 'Enable browser notifications'
              }
              title={
                push.state === 'blocked'
                  ? 'Notifications are blocked in your browser settings for this site.'
                  : push.state === 'enabled'
                    ? 'Disable browser notifications'
                    : 'Enable browser notifications'
              }
              className="inline-flex items-center rounded-md p-1 text-primary hover:bg-primary/10 disabled:opacity-40"
            >
              {push.state === 'enabled' ? (
                <BellOff className="size-3.5" aria-hidden />
              ) : (
                <BellRing className="size-3.5" aria-hidden />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => markAll.mutate()}
            disabled={!hasUnread || busy}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-40"
          >
            <CheckCheck className="size-3.5" aria-hidden />
            Mark all read
          </button>
        </div>
      </div>

      <div className="border-b border-border px-3 py-2">
        {/* Pill segmented control, mirroring the full /notifications page. */}
        <div className="inline-flex rounded-lg border border-border bg-secondary/50 p-0.5">
          {([['All', false], ['Unread', true]] as const).map(([label, value]) => {
            const active = unreadOnly === value;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setUnreadOnly(value)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none',
                  active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
                {value && unread > 0 && (
                  <span
                    className={cn(
                      'flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-4',
                      active ? 'bg-primary text-primary-foreground' : 'bg-primary/15 text-primary',
                    )}
                  >
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
        {isPending ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden />
          </div>
        ) : isError ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">Couldn&rsquo;t load notifications.</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-muted-foreground">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-secondary">
              <BellOff className="size-5" aria-hidden />
            </span>
            <p className="text-sm">{unreadOnly ? 'No unread notifications.' : 'You’re all caught up.'}</p>
          </div>
        ) : (
          items.map((item) => (
            <NotificationFeedItem
              key={item.uuid}
              item={item}
              onActivate={onActivate}
              onAcknowledge={onAcknowledge}
              onDismiss={onDismiss}
              busy={busy}
            />
          ))
        )}
      </div>

      <Link
        to="/notifications"
        onClick={() => onClose?.()}
        className="flex items-center justify-center gap-1.5 border-t border-border px-4 py-2.5 text-xs font-medium text-primary hover:bg-primary/5"
      >
        See all notifications
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </div>
  );
}
