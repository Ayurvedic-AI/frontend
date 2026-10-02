import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Bell } from 'lucide-react';
import { useUnreadCount, useNotificationsList } from '../hooks/useNotifications';
import { useNotificationToasts } from '../hooks/useNotificationToasts';
import { NotificationPanel } from './NotificationPanel';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: counts } = useUnreadCount();
  // Poll a small list (even when the popover is closed) to drive arrival toasts.
  const { data: list } = useNotificationsList(false, { poll: true });
  useNotificationToasts(list?.items);

  const unread = counts?.unread_count ?? 0;
  const pending = counts?.pending_ack_count ?? 0;
  const badge = unread > 99 ? '99+' : String(unread);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
          className="relative inline-flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="size-5" aria-hidden />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-4 text-white">
              {badge}
            </span>
          )}
          {unread === 0 && pending > 0 && (
            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-amber-500" aria-hidden />
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 overflow-hidden rounded-lg border border-border bg-white shadow-lg focus-visible:outline-none"
        >
          <NotificationPanel onClose={() => setOpen(false)} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
