/** The register's safety column: every allergy as a pill, never truncated. */
export function AllergyPills({ allergies }: { allergies: string[] }) {
  if (allergies.length === 0) return <span className="text-xs text-muted-foreground">None recorded</span>;
  return (
    <ul className="flex flex-wrap gap-1" aria-label="Allergies">
      {allergies.map((a) => (
        <li key={a} className="rounded-full bg-destructive-01 px-2 py-0.5 text-xs font-medium text-destructive-70">
          {a}
        </li>
      ))}
    </ul>
  );
}
