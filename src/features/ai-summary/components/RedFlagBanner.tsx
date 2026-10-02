import { TriangleAlert } from 'lucide-react';
import type { VersesResult } from '../api/ai-summary-stubs';

/** Backend triage result. Shown above everything else; never collapsible. */
export function RedFlagBanner({ result }: { result: VersesResult }) {
  if (!result.urgent) return null;
  return (
    <div role="alert" className="flex gap-3 rounded-lg border border-destructive-10 bg-destructive-01 p-4 text-destructive-70">
      <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold">Red flags: {result.red_flags.join(', ')}</p>
        {result.advice && <p className="mt-1 text-sm">{result.advice}</p>}
      </div>
    </div>
  );
}
