// Shared notification presentation helpers (feature 053). Used by the full-page
// feed, the recency grouping, and the bell popover so relative-time + severity
// styling never drift between them.
import type { NotificationOut, Severity } from '../api/notifications';
import { formatDate } from '../../../utils/format';

/** Severity → dot/accent background color (Tailwind). */
export const SEVERITY_DOT: Record<Severity, string> = {
  INFO: 'bg-sky-500',
  WARNING: 'bg-amber-500',
  CRITICAL: 'bg-red-500',
};

/** Severity → soft icon-chip classes (bg + text) for the modern feed item. */
export const SEVERITY_CHIP: Record<Severity, string> = {
  INFO: 'bg-sky-100 text-sky-600',
  WARNING: 'bg-amber-100 text-amber-700',
  CRITICAL: 'bg-red-100 text-red-600',
};

/** Compact relative time without pulling in a dayjs plugin. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export interface NotificationGroupData {
  key: 'today' | 'yesterday' | 'week' | 'earlier';
  label: string;
  items: NotificationOut[];
}

/**
 * Bucket notifications (assumed newest-first) into ordered recency groups for the
 * social-app style feed: Today / Yesterday / Earlier this week / Earlier. Only
 * non-empty groups are returned, in order.
 */
export function bucketByRecency(items: NotificationOut[]): NotificationGroupData[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86_400_000;
  const startOfWeek = startOfToday - 6 * 86_400_000; // last 7 calendar days incl. today

  const today: NotificationOut[] = [];
  const yesterday: NotificationOut[] = [];
  const week: NotificationOut[] = [];
  const earlier: NotificationOut[] = [];

  for (const n of items) {
    const t = new Date(n.created_at).getTime();
    if (t >= startOfToday) today.push(n);
    else if (t >= startOfYesterday) yesterday.push(n);
    else if (t >= startOfWeek) week.push(n);
    else earlier.push(n);
  }

  const groups: NotificationGroupData[] = [];
  if (today.length) groups.push({ key: 'today', label: 'Today', items: today });
  if (yesterday.length) groups.push({ key: 'yesterday', label: 'Yesterday', items: yesterday });
  if (week.length) groups.push({ key: 'week', label: 'Earlier this week', items: week });
  if (earlier.length) groups.push({ key: 'earlier', label: 'Earlier', items: earlier });
  return groups;
}

/** Map a notification's linked record to an in-app route. Unknown types → no nav. */
export function linkToPath(
  type: string | null | undefined,
  uuid: string | null | undefined,
): string | null {
  if (!type || !uuid) return null;
  switch (type) {
    case 'crm_lead':
      return `/crm/${uuid}`;
    default:
      return null;
  }
}
