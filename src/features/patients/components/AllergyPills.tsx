import { TriangleAlert } from 'lucide-react';

/**
 * Safety facts: every allergy as an amber caution pill, never truncated. Amber, not red:
 * red is reserved for red flags and errors.
 */
export function AllergyPills({ allergies }: { allergies: string[] }) {
  if (allergies.length === 0) return <span className="text-xs text-muted-foreground">None recorded</span>;
  return (
    <ul className="flex flex-wrap gap-1" aria-label="Allergies">
      {allergies.map((a) => (
        <li
          key={a}
          className="inline-flex items-center gap-1 rounded-full bg-warning-01 px-2 py-0.5 text-xs font-medium text-warning-60 ring-1 ring-inset ring-warning-05"
        >
          <TriangleAlert aria-hidden className="size-3" />
          {a}
        </li>
      ))}
    </ul>
  );
}
