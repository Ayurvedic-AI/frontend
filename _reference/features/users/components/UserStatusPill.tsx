import { cn } from '../../../lib/cn';

interface UserStatusPillProps {
  isActive: boolean;
  passwordSet: boolean;
}

/**
 * Three-state account status for the users table:
 * - Pending  — user was invited but hasn't set their password yet
 * - Active   — password set and the account is enabled
 * - Inactive — account disabled
 */
export function UserStatusPill({ isActive, passwordSet }: UserStatusPillProps) {
  const { label, classes } = !passwordSet
    ? { label: 'Pending', classes: 'bg-warning/10 text-warning' }
    : isActive
      ? { label: 'Active', classes: 'bg-positive/10 text-positive' }
      : { label: 'Inactive', classes: 'bg-destructive/10 text-destructive' };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        classes,
      )}
    >
      {label}
    </span>
  );
}
