import type { ReactNode } from 'react';
import { formatDateTime } from '../../../utils/format';
import {
  AllergyPills,
  GENDER_LABEL,
  LANGUAGE_LABEL,
  PRAKRITI_LABEL,
  ageInYears,
  type Patient,
} from '../../patients';

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="min-w-0">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="mt-0.5 text-sm text-foreground">{children}</dd>
  </div>
);

/** Who this consultation is for, with the patient's safety facts always in view. */
export function PatientStrip({ patient, consultationId, createdAt }: { patient: Patient; consultationId: number; createdAt: string }) {
  const list = (items: string[]) => (items.length ? items.join(', ') : <span className="text-muted-foreground">None recorded</span>);
  return (
    <section aria-label="Patient" className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-xl font-semibold text-foreground">{patient.full_name}</h2>
        <p className="text-xs tabular-nums text-muted-foreground">
          Consultation #{consultationId} · {formatDateTime(createdAt)}
        </p>
      </div>
      <p className="text-sm tabular-nums text-muted-foreground">
        {patient.id} · {ageInYears(patient.date_of_birth)} yrs · {GENDER_LABEL[patient.gender]} · speaks{' '}
        {LANGUAGE_LABEL[patient.preferred_language]}
      </p>
      <dl className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Allergies">
          <AllergyPills allergies={patient.allergies} />
        </Fact>
        <Fact label="Prakriti">{PRAKRITI_LABEL[patient.prakriti]}</Fact>
        <Fact label="Existing conditions">{list(patient.conditions)}</Fact>
        <Fact label="Current medications">{list(patient.medications)}</Fact>
      </dl>
    </section>
  );
}
