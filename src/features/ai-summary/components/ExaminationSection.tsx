import { cn } from '../../../lib/cn';
import { formatDateTime } from '../../../utils/format';
import type { Examination } from '../api/ai-summary-stubs';
import {
  AGNI_DESCRIPTION,
  ASSESSMENT_SECTIONS,
  PARIKSHA_SECTIONS,
  fieldLabel,
  formatFinding,
  isAlertField,
  splitSections,
} from '../utils/pariksha';
import { SectionEmpty, SectionLoading, SummarySection } from './SummarySection';

function SectionGrid({ exam, sections }: { exam: Examination; sections: [string, string][] }) {
  const { recorded, missing } = splitSections(exam.findings, sections);
  return (
    <>
      {recorded.length > 0 && (
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          {recorded.map((s) => (
            <div key={s.key} className="min-w-0">
              <h3 className="mb-2 text-sm font-semibold text-foreground">{s.label}</h3>
              <dl className="divide-y divide-border/60 text-sm">
                {s.rows.map(([field, value]) => {
                  const alert = isAlertField(field, value);
                  return (
                    <div key={field} className="flex justify-between gap-4 py-1.5">
                      <dt className="text-muted-foreground">{fieldLabel(field)}</dt>
                      <dd className={cn('text-right tabular-nums text-foreground', alert && 'font-medium text-destructive-70')}>
                        {formatFinding(value)}
                        {field === 'agni' && AGNI_DESCRIPTION[value as string] && (
                          <span className="block text-xs font-normal text-muted-foreground">
                            {AGNI_DESCRIPTION[value as string]}
                          </span>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
              {s.notes && <p className="mt-2 text-sm text-muted-foreground">{s.notes}</p>}
            </div>
          ))}
        </div>
      )}
      {missing.length > 0 && (
        <p className="mt-4 text-xs text-muted-foreground">Not recorded: {missing.join(', ')}</p>
      )}
    </>
  );
}

/** Latest saved Ashtavidha Pariksha and the doctor-led Agni / Mala assessments. */
export function ExaminationSection({ exam, loading }: { exam: Examination | null; loading: boolean }) {
  const hint = exam ? `Recorded by ${exam.examiner} · ${formatDateTime(exam.recorded_at)}` : undefined;
  return (
    <>
      <SummarySection title="Ashtavidha Pariksha" hint={hint}>
        {loading ? (
          <SectionLoading />
        ) : exam ? (
          <SectionGrid exam={exam} sections={PARIKSHA_SECTIONS} />
        ) : (
          <SectionEmpty>Examination not saved for this consultation yet.</SectionEmpty>
        )}
      </SummarySection>
      {exam && (
        <SummarySection title="Doctor-led assessments" hint="Patient-reported answers, interpreted by the vaidya.">
          <SectionGrid exam={exam} sections={ASSESSMENT_SECTIONS} />
        </SummarySection>
      )}
    </>
  );
}
