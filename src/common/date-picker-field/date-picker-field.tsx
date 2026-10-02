import * as PopoverPrimitive from '@radix-ui/react-popover';
import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Calendar as CalendarIcon } from 'lucide-react';
import { memo, useCallback, useMemo, useState, type CSSProperties } from 'react';
import { cn } from '../../lib/cn';
import { DrilldownCalendar } from './drilldown-calendar';

dayjs.extend(customParseFormat);

export interface DatePickerProps {
  /** Field name for form handling. */
  name?: string;
  /** Custom styles for the component root. */
  styles?: CSSProperties;
  /** Whether to use custom styling (kept for legacy passthrough — no-op in new implementation). */
  useCustomStyle?: boolean;
  /** Current selected date value. */
  value?: Dayjs | null;
  /** Maximum selectable date. */
  maxDate?: Dayjs;
  /** Minimum selectable date. */
  minDate?: Dayjs;
  /** Callback fired when date changes. */
  onChange: (date: Dayjs | null) => void;
  /** Whether field has validation error. */
  hasError?: boolean;
  /** Error message to display. */
  errorMessage?: string;
  /** Disable future dates. */
  disableFuture?: boolean;
  /** Field label/placeholder text shown in the trigger. */
  label?: string;
  /** Disable past dates. */
  disablePast?: boolean;
  /** Use white background. */
  bgWhite?: boolean;
  /** Date format string (dayjs syntax). */
  format?: string;
  /** Whether the field is disabled. */
  disabled?: boolean;
  /** Whether to show the clear icon. */
  showClearIcon?: boolean;
  className?: string;
}

/**
 * Date picker built on a custom drill-down calendar (DrilldownCalendar) inside
 * a Radix Popover: it opens on the day grid, and clicking the caption cascades
 * day → month → year so users can jump several years at once.
 *
 * Public API preserved from the legacy MUI X DesktopDatePicker:
 *   `value: Dayjs | null` and `onChange(Dayjs | null)`. Internal validation
 *   for disablePast/disableFuture/minDate/maxDate runs identically.
 */
const DatePickerField = (props: DatePickerProps) => {
  const {
    value,
    onChange,
    label,
    // App-wide date display format ("17 Jul 2026") — keep in sync with
    // utils/format.ts formatDate so inputs and read-only views match.
    format = 'DD MMM YYYY',
    minDate,
    maxDate,
    disableFuture = false,
    disablePast = false,
    bgWhite = true,
    disabled = false,
    showClearIcon = true,
    hasError = false,
    errorMessage,
    className,
  } = props;

  const [open, setOpen] = useState(false);
  // Internal state survives a no-value parent (consumer of the legacy API
  // updates `value` from `onChange`, so we use the "derive state from prop"
  // pattern instead of an effect.
  const [internalValue, setInternalValue] = useState<Dayjs | null>(() =>
    value ? dayjs(value) : null,
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  // React's "store information from previous renders" pattern — sync the
  // controlled `value` prop into local state without an effect.
  const [lastValue, setLastValue] = useState(value);
  if (lastValue !== value) {
    setLastValue(value);
    setInternalValue(value ? dayjs(value) : null);
    setValidationError(null);
  }

  const validateDate = useCallback(
    (dateValue: Dayjs | null): string | null => {
      if (!dateValue) return null;
      if (!dateValue.isValid()) return 'Invalid date format';
      const today = dayjs().startOf('day');
      const d = dateValue.startOf('day');
      if (disablePast && d.isBefore(today)) return 'Past dates are not allowed';
      if (disableFuture && d.isAfter(today)) return 'Future dates are not allowed';
      if (minDate) {
        const min = dayjs(minDate).startOf('day');
        if (d.isBefore(min)) return `Date must be on or after ${min.format(format)}`;
      }
      if (maxDate) {
        const max = dayjs(maxDate).startOf('day');
        if (d.isAfter(max)) return `Date must be on or before ${max.format(format)}`;
      }
      return null;
    },
    [disablePast, disableFuture, minDate, maxDate, format],
  );

  const handleSelect = useCallback(
    (next: Dayjs | null) => {
      const asDayjs = next ? dayjs(next) : null;
      const err = validateDate(asDayjs);
      setValidationError(err);
      setInternalValue(asDayjs);
      if (asDayjs && asDayjs.isValid() && !err) {
        onChange(asDayjs);
        setOpen(false);
      } else if (!asDayjs) {
        onChange(null);
      }
    },
    [onChange, validateDate],
  );

  const displayValue = useMemo(
    () => (internalValue && internalValue.isValid() ? internalValue.format(format) : ''),
    [internalValue, format],
  );

  const showError = hasError || Boolean(validationError);
  // Resolve the selectable window once, folding disablePast/disableFuture into
  // the min/max bounds. The calendar uses these to disable out-of-range days,
  // months AND years (so the drill-down can't jump past the limits).
  const minBound = useMemo<Dayjs | null>(() => {
    const bounds: Dayjs[] = [];
    if (minDate) bounds.push(dayjs(minDate));
    if (disablePast) bounds.push(dayjs());
    return bounds.length ? bounds.reduce((a, b) => (a.isAfter(b) ? a : b)) : null;
  }, [minDate, disablePast]);
  const maxBound = useMemo<Dayjs | null>(() => {
    const bounds: Dayjs[] = [];
    if (maxDate) bounds.push(dayjs(maxDate));
    if (disableFuture) bounds.push(dayjs());
    return bounds.length ? bounds.reduce((a, b) => (a.isBefore(b) ? a : b)) : null;
  }, [maxDate, disableFuture]);

  return (
    <div className={cn('flex w-full flex-col', className)}>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-invalid={showError || undefined}
            className={cn(
              'flex h-11 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm',
              'border-input',
              'focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40',
              'disabled:cursor-not-allowed disabled:opacity-60',
              bgWhite ? 'bg-white' : 'bg-background',
              showError && 'border-destructive focus:border-destructive focus:ring-destructive/30',
            )}
          >
            <span className={cn('truncate', !displayValue && 'text-muted-foreground')}>
              {displayValue || label || 'Select Date'}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              {showClearIcon && internalValue && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Clear date"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(null);
                    }
                  }}
                  className="rounded p-1 text-muted-foreground hover:bg-secondary"
                >
                  ×
                </span>
              )}
              <CalendarIcon aria-hidden className="size-4 text-muted-foreground" />
            </span>
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            sideOffset={6}
            className="z-50 rounded-md border border-border bg-background p-3 shadow-lg"
          >
            <DrilldownCalendar
              selected={internalValue && internalValue.isValid() ? internalValue : null}
              onSelect={handleSelect}
              minBound={minBound}
              maxBound={maxBound}
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {(hasError || validationError) && (errorMessage || validationError) && (
        <p role="alert" className="mt-1 text-xs leading-tight text-destructive">
          {validationError || errorMessage}
        </p>
      )}
    </div>
  );
};

export default memo(DatePickerField);
export { DatePickerField };
