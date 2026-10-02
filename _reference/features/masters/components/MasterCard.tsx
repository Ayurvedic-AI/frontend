import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../../lib/cn';

export interface MasterSection {
  key: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  to?: string;
  ready?: boolean;
  /** Live record count (feature 027); omitted → no badge. */
  count?: number;
}

export function MasterCard({
  label,
  description,
  icon: Icon,
  to,
  ready,
  count,
}: Omit<MasterSection, 'key'>) {
  const inner = (
    <div
      className={cn(
        'flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition',
        ready ? 'hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md' : 'opacity-60',
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'flex size-10 items-center justify-center rounded-lg',
            ready ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="size-5" />
        </span>
        {!ready ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Coming soon
          </span>
        ) : count !== undefined ? (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
            {count.toLocaleString()}
          </span>
        ) : null}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      {ready && <span className="mt-auto text-xs font-medium text-primary">Manage →</span>}
    </div>
  );

  if (ready && to) {
    return (
      <Link
        to={to}
        className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {inner}
      </Link>
    );
  }
  return <div aria-disabled="true">{inner}</div>;
}
