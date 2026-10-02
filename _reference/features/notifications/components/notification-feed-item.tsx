import { AlertCircle, AlertTriangle, Check, Info, X } from 'lucide-react';
import type { ComponentType } from 'react';
import type { NotificationOut, Severity } from '../api/notifications';
import { SEVERITY_CHIP, timeAgo } from './notification-utils';

const SEVERITY_ICON: Record<Severity, ComponentType<{ className?: string }>> = {
  INFO: Info,
  WARNING: AlertTriangle,
  CRITICAL: AlertCircle,
};

interface NotificationFeedItemProps {
  item: NotificationOut;
  onActivate: (item: NotificationOut) => void;
  onAcknowledge: (uuid: string) => void;
  onDismiss: (uuid: string) => void;
  busy?: boolean;
}

/**
 * Modern, scannable notification card (feature 053 US2) — a leading severity icon
 * chip, title with read/unread emphasis, a short preview, relative time, and tidy
 * trailing actions. Shared by the full-page feed and the bell popover so both read
 * like a familiar social-app feed.
 */
export function NotificationFeedItem({
  item,
  onActivate,
  onAcknowledge,
  onDismiss,
  busy,
}: NotificationFeedItemProps) {
  const unread = item.read_at === null;
  const canDismiss = !item.is_pending_ack;
  const Icon = SEVERITY_ICON[item.severity];

  return (
    <div
      className={`group relative flex gap-3 px-4 py-3 transition-colors hover:bg-muted/60 ${
        unread ? 'bg-primary/[0.04]' : ''
      }`}
      data-slot="notification-feed-item"
    >
      {/* Unread accent rail */}
      {unread && <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" aria-hidden />}

      <span
        className={`mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full ${SEVERITY_CHIP[item.severity]}`}
        aria-hidden
      >
        <Icon className="size-[18px]" />
      </span>

      <button
        type="button"
        onClick={() => onActivate(item)}
        className="min-w-0 flex-1 text-left focus-visible:outline-none"
      >
        <div className="flex items-center gap-2">
          <p
            className={`truncate text-sm ${
              unread ? 'font-semibold text-foreground' : 'font-medium text-foreground/90'
            }`}
          >
            {item.title}
          </p>
          {unread && <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-muted-foreground">{timeAgo(item.created_at)}</span>
          {item.is_pending_ack && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
              Needs acknowledgment
            </span>
          )}
        </div>
      </button>

      <div className="flex shrink-0 items-start gap-1">
        {item.is_pending_ack && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAcknowledge(item.uuid)}
            title="Acknowledge"
            aria-label="Acknowledge"
            className="inline-flex size-11 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 sm:size-9"
          >
            <Check className="size-4" aria-hidden />
          </button>
        )}
        {canDismiss && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onDismiss(item.uuid)}
            title="Dismiss"
            aria-label="Dismiss"
            className="inline-flex size-11 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 sm:size-9"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
