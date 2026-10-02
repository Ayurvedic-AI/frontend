import type { ComponentType, ReactNode } from 'react';
import { AlertCircle, AlertTriangle, Info, Megaphone, Users } from 'lucide-react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { cn } from '../../../lib/cn';
import { formatDateTime, formatRelativeTime } from '../../../utils/format';
import { AnnouncementAckTable } from './AnnouncementAckTable';
import { audienceLabel } from './announcement-utils';
import { SEVERITY_CHIP } from './notification-utils';
import type { AnnouncementOut } from '../api/notifications';
import type { Severity } from '../api/notifications';

interface Props {
  /** The announcement to show; null = drawer closed. */
  announcement: AnnouncementOut | null;
  onClose: () => void;
}

const SEVERITY_ICON: Record<Severity, ComponentType<{ className?: string }>> = {
  INFO: Info,
  WARNING: AlertTriangle,
  CRITICAL: AlertCircle,
};
const SEVERITY_HERO: Record<Severity, string> = {
  INFO: 'border-info/25 bg-info/5',
  WARNING: 'border-warning/30 bg-warning/5',
  CRITICAL: 'border-destructive/25 bg-destructive/5',
};
const SEVERITY_LABEL: Record<Severity, string> = {
  INFO: 'Info',
  WARNING: 'Warning',
  CRITICAL: 'Critical',
};

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

/**
 * Read-only announcement detail in the standard side drawer (052 US2): a
 * severity-tinted hero, the full message, delivery facts, and — when
 * acknowledgment is required — a progress bar plus the recipient / read /
 * acknowledgment list (reusing `AnnouncementAckTable`).
 */
export function AnnouncementDetailDrawer({ announcement, onClose }: Props) {
  const severity = announcement?.severity ?? 'INFO';
  const Icon = SEVERITY_ICON[severity] ?? Megaphone;
  const ackPct =
    announcement && announcement.requires_acknowledgment && announcement.recipient_count > 0
      ? Math.round((announcement.acknowledged_count / announcement.recipient_count) * 100)
      : null;

  return (
    <CustomDrawer
      anchor="right"
      title="Announcement"
      open={announcement !== null}
      onClose={onClose}
      drawerWidth="42rem"
      drawerPadding="0px"
    >
      {announcement && (
        <div className="flex min-h-full flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          {/* Severity hero — what was announced, to whom, how urgent. */}
          <div className={cn('flex items-start gap-3 rounded-lg border p-4', SEVERITY_HERO[severity])}>
            <span
              className={cn(
                'inline-flex size-10 shrink-0 items-center justify-center rounded-full',
                SEVERITY_CHIP[severity],
              )}
              aria-hidden
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-snug text-foreground">{announcement.title}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {audienceLabel(announcement)} · {SEVERITY_LABEL[severity]} · Sent{' '}
                {formatRelativeTime(announcement.sent_at)}
              </p>
            </div>
          </div>

          {/* Message body */}
          <SectionCard title="Message">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{announcement.message}</p>
          </SectionCard>

          {/* Delivery facts */}
          <SectionCard title="Delivery">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Meta label="Sent" value={formatDateTime(announcement.sent_at)} />
              <Meta label="Audience" value={audienceLabel(announcement)} />
              <Meta label="Recipients" value={String(announcement.recipient_count)} />
            </dl>
            {/* Acknowledgment progress — the number that matters, as a bar. */}
            {ackPct != null && (
              <div className="mt-3 border-t border-border/60 pt-3">
                <div className="mb-1.5 flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground">Acknowledged</span>
                  <span className="tabular-nums font-medium text-foreground">
                    {announcement.acknowledged_count}/{announcement.recipient_count} ({ackPct}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn('h-full rounded-full', ackPct === 100 ? 'bg-positive-70' : 'bg-primary')}
                    style={{ width: `${ackPct}%` }}
                  />
                </div>
              </div>
            )}
          </SectionCard>

          {/* Recipients / acknowledgment — only when acknowledgment is required */}
          {announcement.requires_acknowledgment ? (
            <SectionCard title="Recipients">
              <AnnouncementAckTable announcementUuid={announcement.uuid} />
            </SectionCard>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              <Users className="size-4 shrink-0" aria-hidden />
              Acknowledgment is not required for this announcement.
            </div>
          )}
          </div>
          <div className="sticky bottom-0 shrink-0 flex justify-end border-t border-border bg-background px-6 py-4">
            <CustomButton type="button" variant="outline" onClick={onClose}>
              Close
            </CustomButton>
          </div>
        </div>
      )}
    </CustomDrawer>
  );
}
