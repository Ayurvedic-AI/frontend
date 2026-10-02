import { useState } from 'react';
import { Bell, BellOff, BellRing, CheckCheck, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { useNotificationActions, useUnreadCount } from '../hooks/useNotifications';
import { usePushNotifications } from '../hooks/use-push-notifications';
import { NotificationFeed } from '../components/notification-feed';

/**
 * Full-page personal notification center (feature 053 US1/US2). Available to every
 * authenticated user (route is not permission-gated). Browses the complete history
 * with infinite scroll, an All/Unread filter, and mark-all-read.
 */
export function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data: counts } = useUnreadCount();
  const { markAll } = useNotificationActions();
  const push = usePushNotifications();

  const unread = counts?.unread_count ?? 0;
  const pendingAck = counts?.pending_ack_count ?? 0;
  const hasUnread = unread > 0;

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      {/* Header hero — where you stand at a glance */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'relative inline-flex size-11 shrink-0 items-center justify-center rounded-full',
              hasUnread ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground',
            )}
          >
            <Bell className="size-5" aria-hidden />
            {hasUnread && (
              <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">Notifications</h1>
            <p className="text-xs text-muted-foreground">
              {hasUnread ? `${unread} unread` : 'All caught up'}
              {pendingAck > 0 && ` · ${pendingAck} awaiting acknowledgment`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Browser push toggle (feature 069) — hidden where Web Push is
              unsupported or the server has no VAPID keys configured. */}
          {push.state !== 'unsupported' && (
            <button
              type="button"
              onClick={() => (push.state === 'enabled' ? void push.disable() : void push.enable())}
              disabled={push.state === 'busy' || push.state === 'blocked'}
              title={
                push.state === 'blocked'
                  ? 'Notifications are blocked in your browser settings for this site.'
                  : undefined
              }
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-40',
                push.state === 'enabled'
                  ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
                  : 'border-border bg-background text-foreground hover:bg-secondary',
              )}
            >
              {push.state === 'busy' ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : push.state === 'enabled' ? (
                <BellOff className="size-4" aria-hidden />
              ) : (
                <BellRing className="size-4" aria-hidden />
              )}
              {push.state === 'enabled' ? 'Browser alerts on' : 'Enable browser alerts'}
            </button>
          )}
          <button
            type="button"
            onClick={() => markAll.mutate()}
            disabled={!hasUnread || markAll.isPending}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-40"
          >
            {markAll.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <CheckCheck className="size-4" aria-hidden />
            )}
            Mark all read
          </button>
        </div>
      </div>

      {/* All / Unread — pill segmented control with a live unread count */}
      <div className="mt-4 inline-flex rounded-lg border border-border bg-secondary/50 p-1">
        {([['All', false], ['Unread', true]] as const).map(([label, value]) => {
          const active = unreadOnly === value;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setUnreadOnly(value)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none',
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

      <div className="mt-4">
        <NotificationFeed unreadOnly={unreadOnly} />
      </div>
    </div>
  );
}

export default NotificationsPage;
