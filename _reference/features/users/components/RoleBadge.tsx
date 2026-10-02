import { cn } from '../../../lib/cn';

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-primary/10 text-primary',
  staff: 'bg-info/10 text-info',
  user: 'bg-secondary text-secondary-foreground',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  staff: 'Staff',
  user: 'User',
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        ROLE_STYLES[role] ?? 'bg-secondary text-secondary-foreground',
      )}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}
