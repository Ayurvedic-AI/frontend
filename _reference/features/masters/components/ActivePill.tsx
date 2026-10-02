import { cn } from '../../../lib/cn';

/** Active/Deactivated status pill shared across the master tables. */
export function ActivePill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        active ? 'bg-positive/10 text-positive' : 'bg-destructive/10 text-destructive',
      )}
    >
      {active ? 'Active' : 'Deactivated'}
    </span>
  );
}
