import type { VersesResult } from '../api/ai-summary-stubs';
import { SectionEmpty, SectionLoading, SummarySection } from './SummarySection';

interface VersesSectionProps {
  result: VersesResult | undefined;
  loading: boolean;
  /** Backend message when there is nothing to search yet (HTTP 400). */
  unavailable?: string;
}

/** Charaka Samhita verses retrieved for this consultation, with the clauses that matched them. */
export function VersesSection({ result, loading, unavailable }: VersesSectionProps) {
  return (
    <SummarySection
      title="Charaka Samhita references"
      hint="Found by similarity search over the transcript and findings. Check each verse's relevance before relying on it."
    >
      {loading ? (
        <SectionLoading />
      ) : !result ? (
        <SectionEmpty>{unavailable ?? 'References are not available.'}</SectionEmpty>
      ) : result.verses.length === 0 ? (
        <SectionEmpty>No matching verses found.</SectionEmpty>
      ) : (
        <>
          <ol className="space-y-5">
            {result.verses.map((v) => (
              <li key={v.ref}>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <cite className="text-sm font-semibold not-italic tabular-nums text-foreground">{v.ref}</cite>
                  <span className="text-xs text-muted-foreground">matched {v.matched.join(', ')}</span>
                </p>
                <blockquote className="mt-1.5 max-w-prose text-sm leading-relaxed text-neutral-60">{v.text}</blockquote>
              </li>
            ))}
          </ol>
          <details className="mt-5 border-t border-border pt-3 text-sm">
            <summary className="font-medium text-muted-foreground hover:text-foreground">What was searched</summary>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {result.queries.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </details>
        </>
      )}
    </SummarySection>
  );
}
