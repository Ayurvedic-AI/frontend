/**
 * Skeleton rows shown inside the GlobalSearch dropdown while a query is
 * pending. Pure Tailwind — no MUI Skeleton component.
 */
export function GlobalSearchSkeleton() {
  return (
    <div className="p-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2">
          <span className="size-8 shrink-0 animate-pulse rounded-full bg-secondary" />
          <div className="flex-1 space-y-2">
            <span className="block h-3 w-3/5 animate-pulse rounded bg-secondary" />
            <span className="block h-2.5 w-2/5 animate-pulse rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}
