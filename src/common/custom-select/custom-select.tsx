import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { forwardRef, type ChangeEventHandler, type ReactElement } from 'react';
import { cn } from '../../lib/cn';

/**
 * Legacy SelectChangeEvent shape — preserved so existing consumers don't
 * need to change their submit handlers.
 */
export interface SelectChangeEvent<T = string> {
  target: { name: string; value: T };
}

export interface SelectItem {
  value: string;
  label: string;
  disabled?: boolean;
  /** Optional fully-custom rendering for this item (legacy `child` prop). */
  child?: ReactElement;
}

export interface CustomSelectProps {
  placeholder: string;
  name: string;
  value: string | undefined;
  items: SelectItem[];
  onChange: (e: SelectChangeEvent<string>) => void;
  onOpen?: () => void;
  hasError?: boolean;
  loading?: boolean;
  errorMessage?: string;
  isDisabled?: boolean;
  bgWhite?: boolean;
  /** Adds a "None" item at the top of the list. */
  enableDeselect?: boolean;
  /** Legacy variant: shows the active item as a status pill (used by the legacy app). */
  statusPillMode?: boolean;
  height?: string | number;
  fontSize?: string;
  /** Forwarded for legacy compat — height is mapped to a Tailwind class. */
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  UNDER_REVIEW: 'bg-blue-50 text-blue-700',
  COMPLETED: 'bg-positive-01 text-positive-70',
  REJECTED: 'bg-red-50 text-red-700',
  DRAFT: 'bg-gray-100 text-gray-700',
  DOCS_PENDING: 'bg-amber-50 text-amber-700',
  ONBOARDING_IN_PROGRESS: 'bg-blue-50 text-blue-700',
  REQUESTED: 'bg-blue-50 text-blue-600',
};

export const CustomSelect = forwardRef<HTMLButtonElement, CustomSelectProps>(
  function CustomSelect(
    {
      placeholder,
      name,
      value,
      items,
      onChange,
      onOpen,
      hasError,
      errorMessage,
      isDisabled,
      bgWhite,
      enableDeselect,
      statusPillMode,
      height,
      fontSize,
      className,
    },
    ref,
  ) {
    const helperId = `${name}-helper`;

    const handleChange: NonNullable<ChangeEventHandler<HTMLSelectElement>> | undefined = undefined;
    void handleChange; // (placeholder — Radix Select drives changes via onValueChange below)

    const triggerHeight = typeof height === 'number' ? `${height}px` : height;
    const triggerFontSize = fontSize ?? '16px';

    const selectedItem = items.find((item) => item.value === value);

    return (
      <div data-slot="root" className="flex w-full flex-col">
        <SelectPrimitive.Root
          name={name}
          value={value ?? ''}
          onValueChange={(next) =>
            onChange({ target: { name, value: next === '__deselect__' ? '' : next } })
          }
          onOpenChange={(open) => {
            if (open) onOpen?.();
          }}
          disabled={isDisabled}
        >
          <SelectPrimitive.Trigger
            ref={ref}
            data-slot="control"
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? helperId : undefined}
            style={{
              height: triggerHeight,
              fontSize: triggerFontSize,
            }}
            className={cn(
              'flex w-full items-center justify-between rounded-md border px-3 py-2 text-left',
              'border-input text-foreground',
              'focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/40',
              'disabled:cursor-not-allowed disabled:bg-secondary/60 disabled:opacity-70',
              bgWhite ? 'bg-white' : 'bg-background',
              hasError && 'border-destructive focus:border-destructive focus:ring-destructive/30',
              className,
            )}
          >
            {/* Wrapper owns the truncation — Radix's Select.Value does not forward
                className to its text node, so a long label would wrap and grow the
                trigger vertically. min-w-0 + flex-1 + truncate keeps it one line. */}
            <span className="min-w-0 flex-1 truncate text-left">
              <SelectPrimitive.Value placeholder={placeholder}>
                {selectedItem
                  ? statusPillMode && STATUS_STYLES[selectedItem.value]
                    ? (
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          STATUS_STYLES[selectedItem.value],
                        )}
                      >
                        {selectedItem.label}
                      </span>
                    )
                    : selectedItem.label
                  : null}
              </SelectPrimitive.Value>
            </span>
            <SelectPrimitive.Icon asChild>
              <ChevronDown aria-hidden="true" className="size-4 shrink-0 opacity-60" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>

          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              position="popper"
              sideOffset={4}
              data-slot="content"
              className={cn(
                // Menu = trigger width for full-width form selects (so it lines up
                // with inputs), but never narrower than 14rem so the narrow w-44/w-28
                // filter selects stay readable instead of cramping. Effective width =
                // max(trigger width, 14rem).
                'z-50 max-h-72 w-[var(--radix-select-trigger-width)] min-w-[14rem] overflow-hidden',
                'rounded-md border border-border bg-background text-foreground shadow-lg',
                'data-[state=open]:animate-in data-[state=closed]:animate-out',
                'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              )}
            >
              <SelectPrimitive.Viewport className="p-1">
                {enableDeselect && (
                  <SelectPrimitive.Item
                    value="__deselect__"
                    className={cn(
                      'relative flex cursor-pointer select-none items-center rounded px-3 py-2 text-sm italic text-muted-foreground',
                      'data-[highlighted]:bg-secondary data-[highlighted]:outline-none',
                    )}
                  >
                    <SelectPrimitive.ItemText>None</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                )}
                {items.map((opt) => (
                  <SelectPrimitive.Item
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    className={cn(
                      'relative flex min-w-0 cursor-pointer select-none items-center rounded px-3 py-2 text-sm',
                      'data-[highlighted]:bg-secondary data-[highlighted]:text-secondary-foreground data-[highlighted]:outline-none',
                      'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
                    )}
                  >
                    {opt.child ? (
                      <span className="w-full min-w-0">{opt.child}</span>
                    ) : statusPillMode && STATUS_STYLES[opt.value] ? (
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          STATUS_STYLES[opt.value],
                        )}
                      >
                        {opt.label}
                      </span>
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-left">
                        <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                      </span>
                    )}
                    <SelectPrimitive.ItemIndicator className="ml-auto shrink-0 pl-2">
                      <Check aria-hidden="true" className="size-4" />
                    </SelectPrimitive.ItemIndicator>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>

        {hasError && errorMessage && (
          <p id={helperId} role="alert" className="mt-1 text-xs leading-tight text-destructive">
            {errorMessage}
          </p>
        )}
      </div>
    );
  },
);

export default CustomSelect;
