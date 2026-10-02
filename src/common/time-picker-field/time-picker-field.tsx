import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Clock } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { cn } from '../../lib/cn';
import { prefixItWithZero } from './utils';

export interface TimePickerFieldProps {
  /** "HH:mm" (24h) or empty string. */
  value: string;
  onChange: (value: string) => void;
  width?: string;
  hasError?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Time picker as two side-by-side hour/minute selects, replacing the legacy
 * MUI X TimePicker. Value shape is preserved: `"HH:mm"` 24h string, or `""`.
 */
const TimePickerField = ({
  value,
  onChange,
  width,
  hasError,
  errorMessage,
  disabled,
  className,
}: TimePickerFieldProps) => {
  const [hour, minute] = useMemo(() => {
    if (!value) return ['', ''];
    const [h, m] = value.split(':');
    return [h ?? '', m ?? ''];
  }, [value]);

  const set = useCallback(
    (h: string, m: string) => {
      if (!h && !m) {
        onChange('');
        return;
      }
      onChange(`${prefixItWithZero(h || '00')}:${prefixItWithZero(m || '00')}`);
    },
    [onChange],
  );

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => prefixItWithZero(String(i))), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => prefixItWithZero(String(i))), []);

  const triggerClasses = cn(
    'inline-flex items-center justify-between gap-1 rounded-md border bg-background px-3 py-2 text-sm',
    'border-input focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40',
    'disabled:cursor-not-allowed disabled:opacity-60',
    hasError && 'border-destructive focus:border-destructive focus:ring-destructive/30',
  );

  const contentClasses = cn(
    'z-50 max-h-72 overflow-hidden rounded-md border border-border bg-background shadow-lg',
  );

  return (
    <div className={cn('flex w-full flex-col', className)} style={width ? { width } : undefined}>
      <div className="flex items-center gap-2">
        <Clock aria-hidden className="size-4 shrink-0 text-muted-foreground" />

        <SelectPrimitive.Root value={hour} onValueChange={(h) => set(h, minute)} disabled={disabled}>
          <SelectPrimitive.Trigger
            className={cn(triggerClasses, 'w-20')}
            aria-label="Hours"
            aria-invalid={hasError || undefined}
          >
            <SelectPrimitive.Value placeholder="HH" />
            <SelectPrimitive.Icon asChild>
              <ChevronDown aria-hidden className="size-4 opacity-60" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content position="popper" sideOffset={4} className={contentClasses}>
              <SelectPrimitive.Viewport className="p-1">
                {hours.map((h) => (
                  <SelectPrimitive.Item
                    key={h}
                    value={h}
                    className="relative flex cursor-pointer select-none items-center rounded px-3 py-1.5 text-sm data-[highlighted]:bg-secondary data-[highlighted]:outline-none"
                  >
                    <SelectPrimitive.ItemText>{h}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>

        <span className="text-muted-foreground">:</span>

        <SelectPrimitive.Root value={minute} onValueChange={(m) => set(hour, m)} disabled={disabled}>
          <SelectPrimitive.Trigger
            className={cn(triggerClasses, 'w-20')}
            aria-label="Minutes"
            aria-invalid={hasError || undefined}
          >
            <SelectPrimitive.Value placeholder="MM" />
            <SelectPrimitive.Icon asChild>
              <ChevronDown aria-hidden className="size-4 opacity-60" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content position="popper" sideOffset={4} className={contentClasses}>
              <SelectPrimitive.Viewport className="p-1">
                {minutes.map((m) => (
                  <SelectPrimitive.Item
                    key={m}
                    value={m}
                    className="relative flex cursor-pointer select-none items-center rounded px-3 py-1.5 text-sm data-[highlighted]:bg-secondary data-[highlighted]:outline-none"
                  >
                    <SelectPrimitive.ItemText>{m}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>

      {hasError && errorMessage && (
        <p role="alert" className="mt-1 text-xs leading-tight text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default TimePickerField;
export { TimePickerField };
