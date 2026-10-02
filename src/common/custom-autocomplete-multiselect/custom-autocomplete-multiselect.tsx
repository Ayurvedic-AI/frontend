import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Command as CommandPrimitive } from 'cmdk';
import { Loader2, Search, X } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';
import { cn } from '../../lib/cn';

export interface AutocompleteMultiselectOption {
  key: string;
  value: string;
  hide?: boolean;
}

export interface CustomAutocompleteMultiselectProps {
  options: AutocompleteMultiselectOption[];
  /** Array of selected keys. */
  value: string[];
  onChange: (selectedKeys: string[]) => void;
  placeholder: string;
  limitTags: number;
  hasError?: boolean;
  errorMessage?: string;
  onDebounceCall?: (selectedValue: string) => void;
  onInputEmpty?: () => void;
  onClick?: () => void;
  hasStartSearchIcon?: boolean;
  loading?: boolean;
  isDisabled?: boolean;
  hideArrow?: boolean;
  debounceMs?: number;
  className?: string;
}

const COLORS = [
  '#2196F3', '#4CAF50', '#F44336', '#FF9800',
  '#9C27B0', '#00BCD4', '#E91E63', '#795548',
];

function initialOf(name: string): { letter: string; color: string } {
  const trimmed = name.trim();
  const letter = trimmed.charAt(0).toUpperCase() || '?';
  const color = COLORS[name.charCodeAt(0) % COLORS.length];
  return { letter, color };
}

const CustomAutocompleteMultiselect = memo(function CustomAutocompleteMultiselect({
  options,
  value,
  onChange,
  placeholder,
  limitTags,
  hasError,
  errorMessage,
  onDebounceCall,
  onInputEmpty,
  onClick,
  hasStartSearchIcon,
  loading,
  isDisabled,
  hideArrow,
  debounceMs = 1000,
  className,
}: CustomAutocompleteMultiselectProps) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);

  // Selected options preserving order.
  const selectedOptions = useMemo(
    () => value.map((k) => options.find((o) => o.key === k)).filter((o): o is AutocompleteMultiselectOption => Boolean(o)),
    [value, options],
  );

  // Visible (non-hidden, non-selected, filtered) options.
  const visibleOptions = useMemo(() => {
    const q = input.toLowerCase();
    return options.filter((o) => !o.hide && !value.includes(o.key) && o.value.toLowerCase().includes(q));
  }, [options, input, value]);

  // Debounced search callback.
  useEffect(() => {
    if (!onDebounceCall) return;
    const t = setTimeout(() => {
      if (input.length > 3 || input === '') onDebounceCall(input);
    }, debounceMs);
    return () => clearTimeout(t);
  }, [input, onDebounceCall, debounceMs]);

  const remove = (key: string) => onChange(value.filter((k) => k !== key));
  const add = (key: string) => onChange([...value, key]);

  const visibleTags = selectedOptions.slice(0, limitTags);
  const hiddenTagCount = selectedOptions.length - visibleTags.length;

  return (
    <div className={cn('flex w-full flex-col', className)}>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Anchor asChild>
          <div
            onClick={onClick}
            className={cn(
              'flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-md border px-3 py-1.5',
              'border-input',
              'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40',
              hasError && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/30',
              isDisabled && 'cursor-not-allowed opacity-60',
            )}
          >
            {hasStartSearchIcon && (
              <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            )}
            {visibleTags.map((opt) => {
              const { letter, color } = initialOf(opt.value);
              return (
                <span
                  key={opt.key}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary py-0.5 pl-1 pr-2 text-xs"
                >
                  <span
                    aria-hidden
                    className="inline-flex size-5 items-center justify-center rounded-full text-[10px] font-medium text-white"
                    style={{ backgroundColor: color }}
                  >
                    {letter}
                  </span>
                  <span className="max-w-[12rem] truncate">{opt.value}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(opt.key);
                    }}
                    aria-label={`Remove ${opt.value}`}
                    className="rounded p-0.5 hover:bg-background"
                  >
                    <X aria-hidden className="size-3" />
                  </button>
                </span>
              );
            })}
            {hiddenTagCount > 0 && (
              <span className="text-xs text-muted-foreground">+{hiddenTagCount} more</span>
            )}
            <input
              type="text"
              placeholder={selectedOptions.length === 0 ? placeholder : ''}
              value={input}
              disabled={isDisabled}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setInput(e.target.value);
                setOpen(true);
                if (e.target.value === '') onInputEmpty?.();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && input === '' && selectedOptions.length > 0) {
                  remove(selectedOptions[selectedOptions.length - 1].key);
                }
              }}
              className="min-w-[6rem] flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
            />
            {loading && (
              <Loader2 aria-hidden className="size-4 shrink-0 animate-spin text-muted-foreground" />
            )}
            {!hideArrow && !loading && (
              <span className="text-muted-foreground">▾</span>
            )}
          </div>
        </PopoverPrimitive.Anchor>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            sideOffset={4}
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
            className="z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border border-border bg-background shadow-lg"
          >
            <CommandPrimitive shouldFilter={false}>
              <CommandPrimitive.List className="max-h-60 overflow-y-auto p-1">
                {visibleOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {loading ? 'Loading…' : 'No results'}
                  </div>
                ) : (
                  visibleOptions.map((opt) => {
                    const { letter, color } = initialOf(opt.value);
                    return (
                      <CommandPrimitive.Item
                        key={opt.key}
                        value={opt.value}
                        onSelect={() => {
                          add(opt.key);
                          setInput('');
                        }}
                        className="flex cursor-pointer items-center gap-2 rounded px-3 py-1.5 text-sm data-[selected=true]:bg-secondary data-[selected=true]:outline-none"
                      >
                        <span
                          aria-hidden
                          className="inline-flex size-5 items-center justify-center rounded-full text-[10px] font-medium text-white"
                          style={{ backgroundColor: color }}
                        >
                          {letter}
                        </span>
                        <span className="truncate">{opt.value}</span>
                      </CommandPrimitive.Item>
                    );
                  })
                )}
              </CommandPrimitive.List>
            </CommandPrimitive>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {hasError && errorMessage && (
        <p role="alert" className="mt-1 text-xs leading-tight text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
});

export default CustomAutocompleteMultiselect;
export { CustomAutocompleteMultiselect };
