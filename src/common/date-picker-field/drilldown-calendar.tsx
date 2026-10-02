import dayjs, { type Dayjs } from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/cn';

/**
 * A drill-down calendar with three cascading views:
 *   day  → click the "Month YYYY" caption → month grid
 *   month → click the "YYYY" caption       → year grid
 *   year → pick a year → month grid → pick a month → day grid
 *
 * This lets a user jump several years/months at once instead of paging the
 * day view one month at a time. It always opens on the day view (the original
 * flow); each time the popover re-mounts it resets to that view.
 *
 * The public surface is intentionally tiny so it can sit behind the existing
 * DatePickerField API. Out-of-range days/months/years are disabled using the
 * already-resolved [minBound, maxBound] window from the parent.
 */

type View = 'day' | 'month' | 'year';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const YEARS_PER_PAGE = 12;
const CELL = 'flex h-9 items-center justify-center rounded-md text-sm transition-colors';

export interface DrilldownCalendarProps {
  /** Currently selected date (highlighted), or null. */
  selected: Dayjs | null;
  /** Fired with the chosen day. */
  onSelect: (date: Dayjs) => void;
  /** Earliest selectable date (inclusive), already resolving disablePast. */
  minBound?: Dayjs | null;
  /** Latest selectable date (inclusive), already resolving disableFuture. */
  maxBound?: Dayjs | null;
}

export function DrilldownCalendar({ selected, onSelect, minBound, maxBound }: DrilldownCalendarProps) {
  const [view, setView] = useState<View>('day');
  // The month currently in view (first day of that month).
  const [display, setDisplay] = useState<Dayjs>(() =>
    (selected && selected.isValid() ? selected : dayjs()).startOf('month'),
  );

  const today = dayjs().startOf('day');
  const min = minBound ? minBound.startOf('day') : null;
  const max = maxBound ? maxBound.startOf('day') : null;

  const dayDisabled = (d: Dayjs): boolean =>
    Boolean((min && d.startOf('day').isBefore(min)) || (max && d.startOf('day').isAfter(max)));
  const monthDisabled = (m: Dayjs): boolean =>
    Boolean((min && m.endOf('month').isBefore(min)) || (max && m.startOf('month').isAfter(max)));
  const yearDisabled = (y: Dayjs): boolean =>
    Boolean((min && y.endOf('year').isBefore(min)) || (max && y.startOf('year').isAfter(max)));

  // ── Header (prev / caption / next), shared across all three views ────────
  const renderHeader = (label: string, onLabel: (() => void) | null, onPrev: () => void, onNext: () => void, prevOff: boolean, nextOff: boolean) => (
    <div className="mb-2 flex items-center justify-between gap-1">
      <button
        type="button"
        aria-label="Previous"
        disabled={prevOff}
        onClick={onPrev}
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
      </button>
      <button
        type="button"
        disabled={!onLabel}
        onClick={onLabel ?? undefined}
        className={cn(
          'rounded-md px-3 py-1 text-sm font-semibold text-foreground',
          onLabel ? 'hover:bg-secondary' : 'cursor-default',
        )}
      >
        {label}
      </button>
      <button
        type="button"
        aria-label="Next"
        disabled={nextOff}
        onClick={onNext}
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );

  // ── Day view ─────────────────────────────────────────────────────────────
  const renderDays = () => {
    const monthStart = display.startOf('month');
    const gridStart = monthStart.subtract(monthStart.day(), 'day'); // back to Sunday
    const days = Array.from({ length: 42 }, (_, i) => gridStart.add(i, 'day'));

    return (
      <div>
        {renderHeader(
          display.format('MMMM YYYY'),
          () => setView('month'),
          () => setDisplay(display.subtract(1, 'month')),
          () => setDisplay(display.add(1, 'month')),
          monthDisabled(display.subtract(1, 'month')),
          monthDisabled(display.add(1, 'month')),
        )}
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((w) => (
            <div key={w} className="flex h-8 items-center justify-center text-xs font-medium text-muted-foreground">
              {w}
            </div>
          ))}
          {days.map((d) => {
            const outside = d.month() !== display.month();
            const isSelected = Boolean(selected && d.isSame(selected, 'day'));
            const isToday = d.isSame(today, 'day');
            const off = dayDisabled(d);
            return (
              <button
                key={d.format('YYYY-MM-DD')}
                type="button"
                disabled={off}
                onClick={() => onSelect(d)}
                className={cn(
                  CELL,
                  'm-0.5',
                  off && 'cursor-not-allowed opacity-40',
                  !off && !isSelected && 'hover:bg-primary-00',
                  outside && !isSelected && 'text-muted-foreground',
                  isSelected && 'bg-primary font-semibold text-primary-foreground hover:bg-primary',
                  !isSelected && isToday && 'ring-1 ring-inset ring-primary',
                )}
              >
                {d.date()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Month view ─────────────────────────────────────────────────────────────
  const renderMonths = () => {
    const year = display.year();
    return (
      <div>
        {renderHeader(
          String(year),
          () => setView('year'),
          () => setDisplay(display.subtract(1, 'year')),
          () => setDisplay(display.add(1, 'year')),
          yearDisabled(display.subtract(1, 'year')),
          yearDisabled(display.add(1, 'year')),
        )}
        <div className="grid grid-cols-3 gap-1.5 p-1">
          {MONTHS_SHORT.map((label, i) => {
            const m = display.year(year).month(i).startOf('month');
            const off = monthDisabled(m);
            const isSelected = Boolean(selected && selected.year() === year && selected.month() === i);
            const isCurrent = today.year() === year && today.month() === i;
            return (
              <button
                key={label}
                type="button"
                disabled={off}
                onClick={() => {
                  setDisplay(m);
                  setView('day');
                }}
                className={cn(
                  CELL,
                  'h-11',
                  off && 'cursor-not-allowed opacity-40',
                  !off && !isSelected && 'hover:bg-primary-00',
                  isSelected && 'bg-primary font-semibold text-primary-foreground hover:bg-primary',
                  !isSelected && isCurrent && 'ring-1 ring-inset ring-primary',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Year view ─────────────────────────────────────────────────────────────
  const renderYears = () => {
    const pageStart = Math.floor(display.year() / YEARS_PER_PAGE) * YEARS_PER_PAGE;
    const years = Array.from({ length: YEARS_PER_PAGE }, (_, i) => pageStart + i);
    const prevPage = display.year(pageStart - 1);
    const nextPage = display.year(pageStart + YEARS_PER_PAGE);
    return (
      <div>
        {renderHeader(
          `${pageStart} – ${pageStart + YEARS_PER_PAGE - 1}`,
          null,
          () => setDisplay(prevPage),
          () => setDisplay(nextPage),
          yearDisabled(prevPage),
          yearDisabled(nextPage),
        )}
        <div className="grid grid-cols-3 gap-1.5 p-1">
          {years.map((y) => {
            const yearDate = display.year(y);
            const off = yearDisabled(yearDate);
            const isSelected = Boolean(selected && selected.year() === y);
            const isCurrent = today.year() === y;
            return (
              <button
                key={y}
                type="button"
                disabled={off}
                onClick={() => {
                  setDisplay(yearDate);
                  setView('month');
                }}
                className={cn(
                  CELL,
                  'h-11',
                  off && 'cursor-not-allowed opacity-40',
                  !off && !isSelected && 'hover:bg-primary-00',
                  isSelected && 'bg-primary font-semibold text-primary-foreground hover:bg-primary',
                  !isSelected && isCurrent && 'ring-1 ring-inset ring-primary',
                )}
              >
                {y}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-64 select-none">
      {view === 'day' && renderDays()}
      {view === 'month' && renderMonths()}
      {view === 'year' && renderYears()}
    </div>
  );
}
