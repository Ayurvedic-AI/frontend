// Humanises raw audit action codes (e.g. "master.vendor.create",
// "auth.login.success") into plain-English activity descriptions with an icon
// and a semantic tone, so the Activity Log reads for end users — not engineers.
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  FileCheck,
  KeyRound,
  LogIn,
  LogOut,
  Mail,
  PackageCheck,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Truck,
  Activity as ActivityIcon,
  type LucideIcon,
} from 'lucide-react';

export type ActivityTone = 'positive' | 'info' | 'warning' | 'destructive' | 'muted';

export interface ActivityDescriptor {
  /** Plain-English sentence, e.g. "Created vendor". */
  label: string;
  Icon: LucideIcon;
  tone: ActivityTone;
}

const TONE_CLASS: Record<ActivityTone, string> = {
  positive: 'bg-positive/10 text-positive-70',
  info: 'bg-info/10 text-info-60',
  warning: 'bg-warning/10 text-warning-60',
  destructive: 'bg-destructive/10 text-destructive',
  muted: 'bg-secondary text-secondary-foreground',
};

export const activityToneClass = (tone: ActivityTone): string => TONE_CLASS[tone];

/** "raw_material" / "stock_transfer" → "raw material" / "stock transfer". */
export function humanizeEntity(entity?: string | null): string {
  if (!entity) return '';
  return entity.replace(/_/g, ' ').trim().toLowerCase();
}

// Verb rules matched against the action code, in priority order. `standalone`
// rules read on their own (auth events); the rest get the entity noun appended.
interface Rule {
  test: RegExp;
  label: string;
  Icon: LucideIcon;
  tone: ActivityTone;
  standalone?: boolean;
}

const RULES: Rule[] = [
  { test: /login\.success|\.login$/, label: 'Signed in', Icon: LogIn, tone: 'positive', standalone: true },
  { test: /login.*fail|otp_failed/, label: 'Sign-in failed', Icon: AlertTriangle, tone: 'destructive', standalone: true },
  { test: /logout/, label: 'Signed out', Icon: LogOut, tone: 'muted', standalone: true },
  { test: /password_change|password_reset\.completed/, label: 'Changed password', Icon: KeyRound, tone: 'info', standalone: true },
  { test: /password_reset/, label: 'Requested password reset', Icon: KeyRound, tone: 'info', standalone: true },
  { test: /refresh/, label: 'Refreshed session', Icon: RotateCcw, tone: 'muted', standalone: true },
  { test: /invitation\.consume|invitation\.accept/, label: 'Accepted invitation', Icon: CheckCircle2, tone: 'positive', standalone: true },
  { test: /invitation\.revoke/, label: 'Revoked invitation', Icon: ShieldOff, tone: 'destructive', standalone: true },
  { test: /invitation|\.invite$|resend_invitation/, label: 'Sent invitation', Icon: Mail, tone: 'info', standalone: true },
  { test: /grant/, label: 'Granted access to', Icon: ShieldCheck, tone: 'positive' },
  { test: /revoke/, label: 'Revoked access to', Icon: ShieldOff, tone: 'destructive' },
  { test: /dispatch/, label: 'Dispatched', Icon: Truck, tone: 'info' },
  { test: /receive/, label: 'Received', Icon: PackageCheck, tone: 'positive' },
  { test: /approve/, label: 'Approved', Icon: CheckCircle2, tone: 'positive' },
  { test: /complete/, label: 'Completed', Icon: CheckCircle2, tone: 'positive' },
  { test: /cancel/, label: 'Cancelled', Icon: Ban, tone: 'destructive' },
  { test: /post(ed)?(\.|$)/, label: 'Posted', Icon: FileCheck, tone: 'positive' },
  { test: /create/, label: 'Created', Icon: Plus, tone: 'info' },
  { test: /update|edit/, label: 'Updated', Icon: Pencil, tone: 'warning' },
  { test: /delete|remove/, label: 'Deleted', Icon: Trash2, tone: 'destructive' },
  { test: /status/, label: 'Changed status of', Icon: RotateCcw, tone: 'warning' },
  { test: /fail/, label: 'Failed', Icon: AlertTriangle, tone: 'destructive' },
];

/**
 * Describe an audit action for end users. Uses the row's `entity_type` for the
 * noun when present, otherwise the action's own middle segment
 * ("master.vendor.create" → "vendor").
 */
export function describeActivity(action: string, entityType?: string | null): ActivityDescriptor {
  const a = (action || '').toLowerCase();
  const segments = a.split('.');
  const noun = humanizeEntity(entityType) || humanizeEntity(segments.length > 2 ? segments[1] : '');

  for (const rule of RULES) {
    if (rule.test.test(a)) {
      const label = rule.standalone || !noun ? rule.label : `${rule.label} ${noun}`;
      return { label, Icon: rule.Icon, tone: rule.tone };
    }
  }

  // Fallback: title-case the last segment + the noun.
  const last = (segments.pop() ?? a).replace(/_/g, ' ');
  const text = `${last}${noun ? ` ${noun}` : ''}`.trim();
  return {
    label: text.charAt(0).toUpperCase() + text.slice(1),
    Icon: ActivityIcon,
    tone: 'muted',
  };
}
