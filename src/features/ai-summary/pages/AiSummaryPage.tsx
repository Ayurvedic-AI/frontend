import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileSearch } from 'lucide-react';
import { CustomSelect } from '../../../common/custom-select';
import { PageHeader } from '../../../common/page-header';
import { usePatientsList } from '../../patients';
import {
  useConsultationsExamination,
  useConsultationsList,
  useConsultationsTranscripts,
  useConsultationsVerses,
  type Examination,
} from '../api/ai-summary-stubs';
import { ConsultationList } from '../components/ConsultationList';
import { ConversationSection } from '../components/ConversationSection';
import { ExaminationSection } from '../components/ExaminationSection';
import { PatientStrip } from '../components/PatientStrip';
import { RedFlagBanner } from '../components/RedFlagBanner';
import { SectionLoading } from '../components/SummarySection';
import { VersesSection } from '../components/VersesSection';
import { consultationWhen } from '../utils/consultation-when';

/**
 * Everything the assistant produced for one consultation, for the vaidya's review:
 * triage red flags, the conversation, the examination, and Charaka references.
 * `?consultation=<id>` picks one; `?patient=<Reg. No.>` picks that patient's latest.
 */
export function AiSummaryPage() {
  const [params, setParams] = useSearchParams();
  const consultationsQuery = useConsultationsList();
  const { data: patientsRes } = usePatientsList();

  const consultations = useMemo(() => consultationsQuery.data?.data ?? [], [consultationsQuery.data]);
  const patients = useMemo(() => new Map((patientsRes?.data ?? []).map((p) => [p.id, p])), [patientsRes]);

  const patientParam = params.get('patient');
  const selected = patientParam
    ? consultations.find((c) => c.patient_id === patientParam) // list is newest first
    : (consultations.find((c) => c.id === Number(params.get('consultation'))) ?? consultations[0]);
  const cid = selected?.id ?? null;

  const transcripts = useConsultationsTranscripts(cid);
  const examination = useConsultationsExamination(cid);
  const verses = useConsultationsVerses(cid);

  const exam = examination.data?.data && 'id' in examination.data.data ? (examination.data.data as Examination) : null;
  const patient = selected ? patients.get(selected.patient_id) : undefined;

  const pickerItems = consultations.map((c) => ({
    value: String(c.id),
    label: `${patients.get(c.patient_id)?.full_name ?? c.patient_id} · ${consultationWhen(c.created_at)}${c.urgent ? ' · red flags' : ''}`,
  }));

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <PageHeader
        title="AI summary"
        description="What the assistant transcribed, flagged and found for a consultation. Review it before acting on it."
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          {consultationsQuery.isLoading ? (
            <SectionLoading />
          ) : (
            <div className="sticky top-20">
              <ConsultationList consultations={consultations} patients={patients} selectedId={cid} />
            </div>
          )}
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="lg:hidden">
            <CustomSelect
              name="consultation"
              placeholder="Select consultation"
              value={cid ? String(cid) : undefined}
              items={pickerItems}
              onChange={(e) => setParams({ consultation: e.target.value })}
              bgWhite
            />
          </div>

          {consultationsQuery.isLoading ? (
            <SectionLoading />
          ) : !selected ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-12 text-center">
              <FileSearch aria-hidden className="size-8 text-neutral-30" />
              <p className="text-sm text-foreground">
                {patientParam
                  ? `No consultations recorded for ${patients.get(patientParam)?.full_name ?? patientParam} yet.`
                  : 'No consultations recorded yet.'}
              </p>
            </div>
          ) : (
            <>
              {patient && <PatientStrip patient={patient} consultationId={selected.id} createdAt={selected.created_at} />}
              {verses.data && <RedFlagBanner result={verses.data.data} />}
              <ConversationSection transcripts={transcripts.data?.data ?? []} loading={transcripts.isLoading} />
              <ExaminationSection exam={exam} loading={examination.isLoading} />
              <VersesSection
                result={verses.data?.data}
                loading={verses.isLoading}
                unavailable={verses.error ? 'Nothing to search yet: record audio or save the examination first.' : undefined}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
