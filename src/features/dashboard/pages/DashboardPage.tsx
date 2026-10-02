import { useMemo } from 'react';
import dayjs from 'dayjs';
import { ChevronRight, CircleCheck, TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../../common/page-header';
import { cn } from '../../../lib/cn';
import { consultationWhen, useConsultationsList } from '../../ai-summary';
import { usePatientsList } from '../../patients';

const panel = 'rounded-lg border border-border bg-card';

export function DashboardPage() {
  const { data: consultationsRes, isLoading: loadingConsultations } = useConsultationsList();
  const { data: patientsRes, isLoading: loadingPatients } = usePatientsList();
  const loading = loadingConsultations || loadingPatients;

  const patients = useMemo(() => patientsRes?.data ?? [], [patientsRes]);
  const byId = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);
  const today = useMemo(
    () => (consultationsRes?.data ?? []).filter((c) => dayjs(c.created_at).isSame(dayjs(), 'day')),
    [consultationsRes],
  );
  const flagged = today.filter((c) => c.urgent);
  const withAllergies = patients.filter((p) => p.allergies.length > 0).length;

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <PageHeader
        title="Dashboard"
        description={
          <>
            {dayjs().format('dddd, D MMMM YYYY')}
            {!loading && (
              <>
                {' · '}
                <Link to="/patients" className="font-medium text-primary hover:underline">
                  {patients.length} patients, {withAllergies} with known allergies
                </Link>
              </>
            )}
          </>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section aria-label="Today's consultations" className={panel}>
          <h2 className="border-b border-border px-5 py-4 text-lg font-semibold text-foreground">
            Today's consultations
            {!loading && <span className="ml-2 font-normal tabular-nums text-muted-foreground">{today.length}</span>}
          </h2>
          {loading ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">Loading…</p>
          ) : today.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">No consultations yet today.</p>
          ) : (
            <ul>
              {today.map((c) => {
                const p = byId.get(c.patient_id);
                return (
                  <li key={c.id} className="border-b border-border/70 last:border-b-0">
                    <Link
                      to={`/ai-summary?consultation=${c.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <span className="w-20 shrink-0 text-sm tabular-nums text-muted-foreground">
                        {dayjs(c.created_at).format('h:mm A')}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-medium text-foreground">{p?.full_name ?? c.patient_id}</span>
                          {c.urgent && (
                            <span className="rounded-full bg-destructive-01 px-2 py-0.5 text-xs font-medium text-destructive-70">
                              Red flags
                            </span>
                          )}
                        </span>
                        <span className="line-clamp-2 text-xs text-muted-foreground">
                          {c.patient_id}
                          {p?.chief_complaint ? ` · ${p.chief_complaint}` : ''}
                        </span>
                      </span>
                      <ChevronRight aria-hidden className="size-4 shrink-0 text-neutral-30" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-label="Needs attention" className={panel}>
          <h2 className="border-b border-border px-5 py-4 text-lg font-semibold text-foreground">
            Needs attention
            {!loading && (
              <span className={cn('ml-2 tabular-nums', flagged.length ? 'text-destructive-60' : 'font-normal text-muted-foreground')}>
                {flagged.length}
              </span>
            )}
          </h2>
          {loading ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">Loading…</p>
          ) : flagged.length === 0 ? (
            <p className="flex items-center gap-2 px-5 py-6 text-sm text-muted-foreground">
              <CircleCheck aria-hidden className="size-4 text-positive" />
              No red flags in today's consultations.
            </p>
          ) : (
            <ul>
              {flagged.map((c) => (
                <li key={c.id} className="border-b border-border/70 last:border-b-0">
                  <Link
                    to={`/ai-summary?consultation=${c.id}`}
                    className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-destructive-60" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-destructive-70">
                        {byId.get(c.patient_id)?.full_name ?? c.patient_id}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        Red flags · consultation #{c.id} · {consultationWhen(c.created_at)}
                      </span>
                    </span>
                    <ChevronRight aria-hidden className="mt-0.5 size-4 shrink-0 text-neutral-30" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
