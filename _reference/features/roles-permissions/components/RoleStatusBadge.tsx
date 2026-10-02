import { cn } from '../../../lib/cn';

interface RoleStatusBadgeProps {
  /** Role status string from the API ('active' | 'inactive'). */
  status: string;
}

/** Small active/inactive pill for a role (mirrors users/StatusPill). */
export function RoleStatusBadge({ status }: RoleStatusBadgeProps) {
  const active = status === 'active';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        active ? 'bg-positive/10 text-positive' : 'bg-destructive/10 text-destructive',
      )}
    >
      {active ? 'Active' : 'Deactivated'}
    </span>
  );
}
