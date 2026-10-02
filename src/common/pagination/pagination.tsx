import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useMemo, type ChangeEvent } from 'react';
import { cn } from '../../lib/cn';

export interface PaginatorProps {
  /** Current page index (0-based, matching the legacy API). */
  page: number;
  /** Total number of pages. */
  totalPages: number;
  /** Total number of records (used for "X-Y of Z Rows"). */
  totalRecord: number;
  /** Fires when the user changes the page. `event` is null for programmatic changes. */
  onPageChange: (event: ChangeEvent<unknown> | null, page: number) => void;
  /** Fires when the user changes the rows-per-page selector. Omit to hide the selector. */
  onRecordsPerPageChange?: (recordsPerPage: number) => void;
  /** Initial page size (default 5). */
  defaultSize?: number;
  className?: string;
}

const PAGE_SIZES = [5, 10, 20, 50, 100] as const;

/**
 * Build the array of page-button items (1-based) with `…` ellipses, matching
 * the standard "1 … 4 5 6 … 12" shape used by MUI Pagination.
 */
function buildRange(currentPage1: number, totalPages: number, siblingCount: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const first = 1;
  const last = totalPages;
  const start = Math.max(currentPage1 - siblingCount, first + 1);
  const end = Math.min(currentPage1 + siblingCount, last - 1);
  const range: (number | 'ellipsis')[] = [first];
  if (start > first + 1) range.push('ellipsis');
  for (let i = start; i <= end; i += 1) range.push(i);
  if (end < last - 1) range.push('ellipsis');
  range.push(last);
  return range;
}

const Paginator = ({
  page,
  totalPages,
  totalRecord,
  onPageChange,
  onRecordsPerPageChange,
  defaultSize,
  className,
}: PaginatorProps) => {
  // Size is driven by the parent's page size (single source of truth) so the
  // "Rows per page" selector and the "X-Y of Z" range can never disagree with
  // the rows actually rendered.
  const size = defaultSize ?? 5;
  // Always include the active size in the options. Without this, a parent whose
  // default page size isn't one of PAGE_SIZES (e.g. 25) renders a <select> whose
  // value matches no <option>: the browser shows the first option instead, and
  // re-selecting it fires no change event — so "Rows per page" appears stuck and
  // all rows seem to show (#162, #163, #165, #157).
  const sizeOptions = useMemo(
    () => Array.from(new Set<number>([...PAGE_SIZES, size])).sort((a, b) => a - b),
    [size],
  );

  const current1 = page + 1;
  const startRecord = page * size + 1;
  const endRecord = Math.min((page + 1) * size, totalRecord);

  // Hooks MUST be unconditional — keep this above the early return below.
  const range = useMemo(() => buildRange(current1, totalPages, 1), [current1, totalPages]);

  if (totalPages === 0) return null;

  const goto = (next1: number, e: ChangeEvent<unknown> | null = null) => {
    if (next1 < 1 || next1 > totalPages || next1 === current1) return;
    onPageChange(e, next1 - 1);
  };

  return (
    <div
      className={cn(
        'flex flex-col items-stretch justify-between gap-3 px-2 py-3 text-sm',
        'sm:flex-row sm:items-center',
        className,
      )}
      data-slot="root"
    >
      <p className="hidden text-muted-foreground sm:block" data-slot="summary">
        <span className="font-semibold text-foreground">
          {startRecord}-{endRecord}
        </span>{' '}
        of <span className="font-semibold text-foreground">{totalRecord}</span> rows
      </p>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center" data-slot="controls">
        {onRecordsPerPageChange && (
          <label className="hidden items-center gap-2 text-muted-foreground sm:flex">
            <span>Rows per page:</span>
            <select
              value={size}
              onChange={(e) => {
                const next = parseInt(e.target.value, 10);
                onRecordsPerPageChange(next);
                onPageChange(null, 0);
              }}
              aria-label="Rows per page"
              className="h-9 rounded-md border border-input bg-background px-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40"
            >
              {sizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}

        <nav className="flex items-center gap-1" aria-label="Pagination" data-slot="pages">
          <button
            type="button"
            onClick={(e) => goto(current1 - 1, e)}
            disabled={current1 === 1}
            aria-label="Previous page"
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary disabled:opacity-40 disabled:hover:bg-transparent sm:size-10"
          >
            <ChevronLeft aria-hidden className="size-4 sm:size-[18px]" />
          </button>

          {range.map((item, i) =>
            item === 'ellipsis' ? (
              <span
                key={`e-${i}`}
                aria-hidden
                className="inline-flex size-9 items-center justify-center text-muted-foreground sm:size-10"
              >
                <MoreHorizontal className="size-4" />
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={(e) => goto(item, e)}
                aria-current={item === current1 ? 'page' : undefined}
                aria-label={`Page ${item}`}
                className={cn(
                  'inline-flex size-9 items-center justify-center rounded-md text-sm sm:size-10',
                  item === current1
                    ? 'bg-primary/15 font-semibold text-primary'
                    : 'text-foreground hover:bg-secondary',
                )}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={(e) => goto(current1 + 1, e)}
            disabled={current1 === totalPages}
            aria-label="Next page"
            className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary disabled:opacity-40 disabled:hover:bg-transparent sm:size-10"
          >
            <ChevronRight aria-hidden className="size-4 sm:size-[18px]" />
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Paginator;
export { Paginator };
