import { LANGUAGE_LABEL } from '../../patients';
import type { Transcript } from '../api/ai-summary-stubs';
import { SectionEmpty, SectionLoading, SummarySection } from './SummarySection';

const langLabel = (code: string) => LANGUAGE_LABEL[code as keyof typeof LANGUAGE_LABEL] ?? code;

function EditedTag() {
  return <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">Edited</span>;
}

/** Each recorded clip: what the patient said, then the English the rest of the pipeline used. */
export function ConversationSection({ transcripts, loading }: { transcripts: Transcript[]; loading: boolean }) {
  return (
    <SummarySection title="Conversation" hint="Speech-to-text and translation. Edits by the vaidya are shown in place of the model output.">
      {loading ? (
        <SectionLoading />
      ) : transcripts.length === 0 ? (
        <SectionEmpty>No audio recorded for this consultation yet.</SectionEmpty>
      ) : (
        <ol className="space-y-4">
          {transcripts.map((t, i) => {
            const original = t.edited_text ?? t.raw_text;
            const english = t.language === 'en' ? null : (t.edited_translation ?? t.translated_text);
            return (
              <li key={t.transcript_id} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                <p className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Clip {i + 1}</span>
                  <span>
                    {t.speaker} · {langLabel(t.language)}
                  </span>
                  {t.edited_text && <EditedTag />}
                </p>
                <p lang={t.language} className="text-sm leading-relaxed text-foreground">
                  {original}
                </p>
                {english && (
                  <div className="mt-2 rounded-md bg-muted px-3 py-2">
                    <p className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      English {t.edited_translation && <EditedTag />}
                    </p>
                    <p lang="en" className="text-sm leading-relaxed text-foreground">
                      {english}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </SummarySection>
  );
}
