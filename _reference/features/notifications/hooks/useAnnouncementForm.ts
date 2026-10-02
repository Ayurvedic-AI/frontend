import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type {
  AnnouncementCreate,
  AudiencePayload,
} from '../api/notifications';
import type { AnnouncementScheduleCreate } from '../api/announcement-schedules';

// Audience is collapsed into a single select so the composer needs no separate
// user-picker for v1: "ALL" or "ROLE:<name>" where <name> is any role from the
// roles master (loaded dynamically in the composer). (Per-user targeting is
// supported by the API and can be added as a follow-up without a schema change.)
export const announcementSchema = z
  .object({
    audience_choice: z
      .string()
      .min(1, 'Audience is required')
      .refine((v) => v === 'ALL' || v.startsWith('ROLE:'), 'Invalid audience'),
    title: z.string().trim().min(1, 'Title is required').max(200),
    message: z.string().trim().min(1, 'Message is required').max(4000),
    severity: z.enum(['INFO', 'WARNING', 'CRITICAL']),
    requires_acknowledgment: z.boolean(),
    // Recurrence (feature 053). When mode === 'once' the rest is ignored.
    mode: z.enum(['once', 'recurring']),
    interval_choice: z.enum(['7', '15', 'custom']),
    interval_custom_days: z.string().trim(),
    end_date: z.string().trim(),
  })
  .superRefine((v, ctx) => {
    if (v.mode !== 'recurring') return;
    if (v.interval_choice === 'custom') {
      const n = Number(v.interval_custom_days);
      if (!v.interval_custom_days || !Number.isInteger(n) || n < 1 || n > 365) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['interval_custom_days'],
          message: 'Enter a whole number of days between 1 and 365',
        });
      }
    }
    if (v.end_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const d = new Date(v.end_date);
      if (Number.isNaN(d.getTime()) || d < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['end_date'],
          message: 'End date must be today or later',
        });
      }
    }
  });

export type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export const emptyAnnouncement: AnnouncementFormValues = {
  audience_choice: 'ALL',
  title: '',
  message: '',
  severity: 'INFO',
  requires_acknowledgment: false,
  mode: 'once',
  interval_choice: '7',
  interval_custom_days: '',
  end_date: '',
};

/** "factory_manager" → "Factory Manager" for the audience dropdown. */
export function roleLabel(name: string): string {
  return name
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

export const SEVERITY_ITEMS = [
  { value: 'INFO', label: 'Info' },
  { value: 'WARNING', label: 'Warning' },
  { value: 'CRITICAL', label: 'Critical' },
];

export const MODE_ITEMS = [
  { value: 'once', label: 'One-time' },
  { value: 'recurring', label: 'Recurring' },
];

export const INTERVAL_ITEMS = [
  { value: '7', label: 'Every 7 days' },
  { value: '15', label: 'Every 15 days' },
  { value: 'custom', label: 'Custom…' },
];

function toAudience(choice: AnnouncementFormValues['audience_choice']): AudiencePayload {
  if (choice === 'ALL') return { type: 'ALL' };
  return { type: 'ROLE', role: choice.slice('ROLE:'.length) };
}

/** Resolve the chosen cadence to a concrete day count (FR-013). */
export function resolveIntervalDays(v: AnnouncementFormValues): number {
  return v.interval_choice === 'custom' ? Number(v.interval_custom_days) : Number(v.interval_choice);
}

export function toAnnouncementBody(v: AnnouncementFormValues): AnnouncementCreate {
  return {
    audience: toAudience(v.audience_choice),
    title: v.title,
    message: v.message,
    severity: v.severity,
    requires_acknowledgment: v.requires_acknowledgment,
  };
}

export function toScheduleBody(v: AnnouncementFormValues): AnnouncementScheduleCreate {
  return {
    audience: toAudience(v.audience_choice),
    title: v.title,
    message: v.message,
    severity: v.severity,
    requires_acknowledgment: v.requires_acknowledgment,
    interval_days: resolveIntervalDays(v),
    end_date: v.end_date ? v.end_date : null,
  };
}

export function useAnnouncementForm() {
  return useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: emptyAnnouncement,
    mode: 'onSubmit',
  });
}
