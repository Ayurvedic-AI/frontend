import type { ReactNode } from 'react';

interface NotificationGroupProps {
  label: string;
  children: ReactNode;
}

/**
 * A recency group on the notifications feed (feature 053 US2): a sticky section
 * header (Today / Yesterday / …) over its notifications, matching the social-app
 * pattern users already know.
 */
export function NotificationGroup({ label, children }: NotificationGroupProps) {
  return (
    <section>
      <h3 className="sticky top-0 z-10 bg-background/95 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {label}
      </h3>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}
