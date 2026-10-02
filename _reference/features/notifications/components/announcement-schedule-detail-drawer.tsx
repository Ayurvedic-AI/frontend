import { useState, type ComponentType, type ReactNode } from 'react';
import { AlertCircle, AlertTriangle, Ban, CalendarClock, Info, Loader2, Pause, Play } from 'lucide-react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { ConfirmationPopUp } from '../../../common/confirmation-pop-up';
import { cn } from '../../../lib/cn';
import { formatDate, formatDateTime, formatRelativeTime } from '../../../utils/format';
import { audienceLabel } from './announcement-utils';
import { SEVERITY_CHIP } from './notification-utils';
import { useScheduleOccurrences } from '../hooks/use-announcement-schedules';
import type { AnnouncementScheduleOut } from '../api/announcement-schedules';
import type { Severity } from '../api/notifications';

interface Props {
  /** The schedule to show; null = drawer closed. */
  schedule: AnnouncementScheduleOut | null;
  onClose: () => void;
  /** Pause/Resume/Cancel — shown only when the viewer can manage (announcements.create). */
  canManage?: boolean;
  busy?: boolean;
  onPause?: (uuid: string) => void;
  onResume?: (uuid: string) => void;
  onCancel?: (uuid: string) => void;
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

const STATUS_CHIP: Record<string, string> = {
  ACTIVE: 'bg-positive/10 text-positive-70',
  PAUSED: 'bg-warning/10 text-warning-60',
  CANCELLED: 'bg-destructive/10 text-destructive',
  ENDED: 'bg-secondary text-secondary-foreground',
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
 * Read-only recurring-announcement detail (feature 053 US3): a severity-tinted
 * hero with the live status, the message, the schedule facts (next send front
 * and centre), and the delivered occurrences with per-cycle acknowledgment.
 */
export function AnnouncementScheduleDetailDrawer({
  schedule,
  onClose,
  canManage = false,
  busy = false,
  onPause,
  onResume,
  onCancel,
}: Props) {
  const { data, isPending } = useScheduleOccurrences(schedule?.uuid ?? null);
  const occurrences = data?.items ?? [];
  const severity = (schedule?.severity ?? 'INFO') as Severity;
  const Icon = SEVERITY_ICON[severity];
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const showManage = canManage && schedule != null && (schedule.status === 'ACTIVE' || schedule.status === 'PAUSED');

  return (
    <CustomDrawer
      anchor="right"
      title="Recurring announcement"
      open={schedule !== null}
      onClose={onClose}
      drawerWidth="44rem"
      drawerPadding="0px"
    >
      {schedule && (
        <div className="flex min-h-full flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
          {/* Hero — what repeats, for whom, and whether it's still running. */}
          <div className={cn('flex items-start justify-between gap-3 rounded-lg border p-4', SEVERITY_HERO[severity])}>
            <div className="flex min-w-0 items-start gap-3">
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
                <h2 className="text-base font-semibold leading-snug text-foreground">{schedule.title}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {audienceLabel(schedule)} · Every {schedule.interval_days} {schedule.interval_days === 1 ? 'day' : 'days'} ·{' '}
                  {schedule.occurrence_count} sent so far
                </p>
              </div>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize',
                STATUS_CHIP[schedule.status] ?? 'bg-secondary text-secondary-foreground',
              )}
            >
              {schedule.status.toLowerCase()}
            </span>
          </div>

          {/* Next send — the fact users open this drawer for. */}
          {schedule.status === 'ACTIVE' && schedule.next_run_at && (
            <div className="flex items-center gap-2 rounded-lg border border-info/25 bg-info/5 p-3 text-sm">
              <CalendarClock className="size-4 shrink-0 text-info-60" aria-hidden />
              <span className="text-muted-foreground">
                Next send:{' '}
                <span className="font-medium text-foreground">{formatDateTime(schedule.next_run_at)}</span>{' '}
                ({formatRelativeTime(schedule.next_run_at)})
              </span>
            </div>
          )}

          <SectionCard title="Message">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{schedule.message}</p>
          </SectionCard>

          <SectionCard title="Schedule">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <Meta label="Repeats" value={`Every ${schedule.interval_days} ${schedule.interval_days === 1 ? 'day' : 'days'}`} />
              <Meta label="Started" value={formatDate(schedule.start_at)} />
              <Meta label="Ends" value={schedule.end_at ? formatDate(schedule.end_at) : 'Until cancelled'} />
              <Meta label="Audience" value={audienceLabel(schedule)} />
              <Meta
                label="Acknowledgment"
                value={schedule.requires_acknowledgment ? 'Required each cycle' : 'Not required'}
              />
              <Meta label="Occurrences" value={String(schedule.occurrence_count)} />
            </dl>
          </SectionCard>

          <SectionCard title={`Occurrence history${occurrences.length ? ` (${occurrences.length})` : ''}`}>
            {isPending ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" aria-hidden />
              </div>
            ) : occurrences.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No occurrences yet.</p>
            ) : (
              <ol className="flex flex-col">
                {occurrences.map((occ, i) => {
                  const ackPct =
                    occ.requires_acknowledgment && occ.recipient_count > 0
                      ? Math.round((occ.acknowledged_count / occ.recipient_count) * 100)
                      : null;
                  return (
                    <li key={occ.uuid} className="flex gap-3">
                      {/* Dot + connector — reads as a delivery timeline. */}
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            'mt-1.5 size-2.5 shrink-0 rounded-full border-2',
                            i === 0 ? 'border-primary bg-primary' : 'border-primary/50 bg-background',
                          )}
                        />
                        {i < occurrences.length - 1 && <span className="w-px flex-1 bg-border" />}
                      </div>
                      <div className="min-w-0 flex-1 pb-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{formatDateTime(occ.sent_at)}</p>
                          <span className="text-xs text-muted-foreground">{formatRelativeTime(occ.sent_at)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {occ.recipient_count} {occ.recipient_count === 1 ? 'recipient' : 'recipients'}
                          {ackPct == null && !occ.requires_acknowledgment ? ' · acknowledgment not required' : ''}
                        </p>
                        {ackPct != null && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-secondary">
                              <div
                                className={cn('h-full rounded-full', ackPct === 100 ? 'bg-positive-70' : 'bg-primary')}
                                style={{ width: `${ackPct}%` }}
                              />
                            </div>
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {occ.acknowledged_count}/{occ.recipient_count} acknowledged
                            </span>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </SectionCard>
          </div>

          {/* Sticky footer — Close always; Pause/Resume + Cancel for managers while running. */}
          <div className="sticky bottom-0 shrink-0 flex flex-wrap items-center justify-end gap-2 border-t border-border bg-background px-6 py-4">
            <CustomButton type="button" variant="outline" onClick={onClose}>
              Close
            </CustomButton>
            {showManage && (
              <>
                {schedule.status === 'ACTIVE' ? (
                  <CustomButton
                    type="button"
                    variant="outline"
                    loading={busy}
                    icon={<Pause className="size-4" />}
                    onClick={() => onPause?.(schedule.uuid)}
                  >
                    Pause
                  </CustomButton>
                ) : (
                  <CustomButton
                    type="button"
                    variant="outline"
                    loading={busy}
                    icon={<Play className="size-4" />}
                    onClick={() => onResume?.(schedule.uuid)}
                  >
                    Resume
                  </CustomButton>
                )}
                <CustomButton
                  type="button"
                  variant="destructive"
                  loading={busy}
                  icon={<Ban className="size-4" />}
                  onClick={() => setConfirmingCancel(true)}
                >
                  Cancel schedule
                </CustomButton>
              </>
            )}
          </div>

          <ConfirmationPopUp
            open={confirmingCancel}
            onClose={() => setConfirmingCancel(false)}
            onConfirm={() => {
              setConfirmingCancel(false);
              onCancel?.(schedule.uuid);
            }}
            title="Cancel recurring announcement"
            message={
              <>
                Cancel <span className="font-medium">{schedule.title}</span>? No further occurrences
                will be sent. This cannot be undone.
              </>
            }
            confirmLabel="Cancel schedule"
            destructive
            confirmDisabled={busy}
          />
        </div>
      )}
    </CustomDrawer>
  );
}
