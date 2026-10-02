import type { ReactNode } from 'react';

interface SummarySectionProps {
  title: string;
  /** Short muted line under the title: source or caveat. */
  hint?: ReactNode;
  children: ReactNode;
}

/** One block of the summary: a bordered card with a heading. */
export function SummarySection({ title, hint, children }: SummarySectionProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-5" aria-label={title}>
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

/** Quiet placeholder for a section with nothing recorded yet. */
export function SectionEmpty({ children }: { children: ReactNode }) {
  return <p className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">{children}</p>;
}

/** Inline skeleton lines while a section loads. */
export function SectionLoading() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
    </div>
  );
}
