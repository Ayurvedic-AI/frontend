import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface PageHeaderProps {
  title: ReactNode;
  /** One line under the title: what the page is for, or a live count. */
  description?: ReactNode;
  /** Primary / secondary actions, right-aligned on sm+. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Screen title block. The short copper bar above the title is the app's
 * "you are here" mark (same bar as the active nav item); use it only here.
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}
      data-slot="page-header"
    >
      <div className="min-w-0">
        <span aria-hidden className="mb-3 block h-[3px] w-8 rounded-full bg-accent" />
        <h1 className="text-2xl font-semibold leading-tight text-foreground md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
    </header>
  );
}
