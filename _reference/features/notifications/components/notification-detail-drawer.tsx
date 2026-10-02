import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Check, ExternalLink, Info } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { cn } from '../../../lib/cn';
import { formatDateTime, formatRelativeTime } from '../../../utils/format';
import type { NotificationOut, Severity } from '../api/notifications';
import { SEVERITY_CHIP, linkToPath } from './notification-utils';

const SEVERITY_ICON: Record<Severity, ComponentType<{ className?: string }>> = {
  INFO: Info,
  WARNING: AlertTriangle,
  CRITICAL: AlertCircle,
};

// Hero tint per severity — same states language as the inventory drawers.
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

interface Props {
  /** The notification to show; null = drawer closed. */
  notification: NotificationOut | null;
  onClose: () => void;
  onAcknowledge: (uuid: string) => void;
  /** A notification mutation is in flight — disables the Acknowledge button. */
  busy?: boolean;
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

/**
 * Read-only full notification in the standard right-side drawer. The feed item
 * truncates the title and clamps the body to two lines, so this surface exists to
 * show the complete message plus its metadata, with the linked-entity navigation
 * and acknowledgment pinned at the bottom as explicit actions.
 */
export function NotificationDetailDrawer({ notification, onClose, onAcknowledge, busy }: Props) {
  const navigate = useNavigate();
  const path = notification ? linkToPath(notification.link_entity_type, notification.link_entity_uuid) : null;
  const Icon = notification ? SEVERITY_ICON[notification.severity] : Info;

  return (
    <CustomDrawer
      anchor="right"
      title="Notification"
      open={notification !== null}
      onClose={onClose}
      drawerWidth="34rem"
      drawerPadding="0px"
    >
      <div className="flex min-h-full flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {notification && (
            <div className="flex flex-col gap-4">
              {/* Severity hero — what this is about, tinted by urgency. */}
              <div
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-4',
                  SEVERITY_HERO[notification.severity],
                )}
              >
                <span
                  className={cn(
                    'inline-flex size-10 shrink-0 items-center justify-center rounded-full',
                    SEVERITY_CHIP[notification.severity],
                  )}
                  aria-hidden
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold leading-snug text-foreground">{notification.title}</h2>
                  <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                    {notification.category.replace(/_/g, ' ')} · {SEVERITY_LABEL[notification.severity]} ·{' '}
                    {formatRelativeTime(notification.created_at)}
                  </p>
                </div>
              </div>

              {/* Needs-action banner, first thing after the hero. */}
              {notification.is_pending_ack && (
                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-60" aria-hidden />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-warning-60">Acknowledgment required — </span>
                    confirm you've read this using the button below.
                  </p>
                </div>
              )}

              {/* Full message body — not truncated here. */}
              <SectionCard title="Message">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{notification.body}</p>
              </SectionCard>

              <SectionCard title="Details">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <Meta label="Received" value={formatDateTime(notification.created_at)} />
                  <Meta
                    label="Status"
                    value={
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium',
                          notification.read_at
                            ? 'bg-positive/10 text-positive-70'
                            : 'bg-primary/10 text-primary',
                        )}
                      >
                        {notification.read_at ? 'Read' : 'Unread'}
                      </span>
                    }
                  />
                  <Meta
                    label="Acknowledgment"
                    value={
                      notification.requires_acknowledgment
                        ? notification.acknowledged_at
                          ? `Acknowledged ${formatDateTime(notification.acknowledged_at)}`
                          : 'Pending'
                        : 'Not required'
                    }
                  />
                </dl>
              </SectionCard>
            </div>
          )}
        </div>

        {/* Actions pinned to the drawer's bottom edge. */}
        {notification && (
          <div className="sticky bottom-0 shrink-0 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-background px-6 py-4">
            <CustomButton type="button" variant="outline" onClick={onClose}>
              Close
            </CustomButton>
            {path && (
              <CustomButton
                type="button"
                variant="outline"
                icon={<ExternalLink className="size-4" />}
                onClick={() => {
                  onClose();
                  navigate(path);
                }}
              >
                Go to related
              </CustomButton>
            )}
            {notification.is_pending_ack && (
              <CustomButton
                type="button"
                variant="primary"
                loading={Boolean(busy)}
                icon={<Check className="size-4" />}
                onClick={() => {
                  onAcknowledge(notification.uuid);
                  onClose();
                }}
              >
                Acknowledge
              </CustomButton>
            )}
          </div>
        )}
      </div>
    </CustomDrawer>
  );
}

export default NotificationDetailDrawer;
