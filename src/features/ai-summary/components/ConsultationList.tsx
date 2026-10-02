import { Link } from 'react-router-dom';
import { cn } from '../../../lib/cn';
import type { Patient } from '../../patients';
import type { ConsultationListItem } from '../api/ai-summary-stubs';
import { consultationWhen } from '../utils/consultation-when';

interface ConsultationListProps {
  consultations: ConsultationListItem[];
  patients: Map<string, Patient>;
  selectedId: number | null;
}

/** Desktop picker: recent consultations, red-flagged ones marked. */
export function ConsultationList({ consultations, patients, selectedId }: ConsultationListProps) {
  return (
    <nav aria-label="Consultations" className="overflow-hidden rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Recent consultations
      </h2>
      <ul>
        {consultations.map((c) => {
          const active = c.id === selectedId;
          return (
            <li key={c.id} className="border-b border-border/60 last:border-b-0">
              <Link
                to={`?consultation=${c.id}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'block px-4 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                  active ? 'bg-primary-00' : 'hover:bg-muted',
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={cn('truncate text-sm font-medium', active ? 'text-primary-08' : 'text-foreground')}>
                    {patients.get(c.patient_id)?.full_name ?? c.patient_id}
                  </span>
                  {c.urgent && (
                    <span className="shrink-0 rounded-full bg-destructive-01 px-2 py-0.5 text-xs font-medium text-destructive-70">
                      Red flags
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
                  #{c.id} · {consultationWhen(c.created_at)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
