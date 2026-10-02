import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn';

export interface CustomRadioProps {
  /** Whether this radio is selected. */
  checked?: boolean;
  /** Disabled flag. */
  disabled?: boolean;
  /** Visual size. */
  size?: 'sm' | 'md';
  /** Label text. */
  label?: string;
  /** Smaller text below the label. */
  supportingText?: string;
  /** Hide label/text; render only the radio. */
  showText?: boolean;
  /** The radio's value. */
  value?: string;
  /** Optional radio group name (used when not inside a `RadioGroup`). */
  name?: string;
  /**
   * Fired when the radio becomes checked.
   * Note: legacy signature receives `(true, value)`.
   */
  onChange?: (checked: boolean, value?: string) => void;
  className?: string;
  'data-testid'?: string;
  id?: string;
}

const sizeMap = {
  sm: { outer: 'size-4', inner: 'size-1.5', label: 'text-sm', support: 'text-xs' },
  md: { outer: 'size-5', inner: 'size-2', label: 'text-base', support: 'text-sm' },
} as const;

/**
 * Single radio button. For multi-option groups consumers should use the
 * `CustomRadioGroup` component (or the `RHFRadioGroup` wrapper) which renders
 * a Radix `RadioGroup` with an array of `options`.
 */
export const CustomRadio = forwardRef<HTMLButtonElement, CustomRadioProps>(
  function CustomRadio(
    {
      checked = false,
      disabled = false,
      size = 'sm',
      label,
      supportingText,
      showText = true,
      value = 'on',
      name,
      onChange,
      className,
      'data-testid': testId,
      id: idProp,
    },
    ref,
  ) {
    const autoId = useId();
    const id = idProp ?? autoId;
    const dims = sizeMap[size];

    // Standalone radio (not inside a Radix RadioGroup) — we drive Radix via a
    // single-item group so we can still benefit from a11y wiring.
    const control = (
      <RadioGroupPrimitive.Root
        value={checked ? value : ''}
        onValueChange={(next) => onChange?.(true, next)}
        disabled={disabled}
        name={name}
        className="inline-flex"
      >
        <RadioGroupPrimitive.Item
          ref={ref}
          id={id}
          value={value}
          disabled={disabled}
          data-slot="control"
          data-testid={testId}
          className={cn(
            'inline-flex shrink-0 items-center justify-center rounded-full border border-input bg-background',
            'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            'data-[state=checked]:border-primary',
            'disabled:cursor-not-allowed disabled:opacity-60',
            dims.outer,
            className,
          )}
        >
          <RadioGroupPrimitive.Indicator
            data-slot="indicator"
            className={cn('rounded-full bg-primary', dims.inner)}
          />
        </RadioGroupPrimitive.Item>
      </RadioGroupPrimitive.Root>
    );

    if (!showText || !label) return control;

    return (
      <label
        htmlFor={id}
        data-slot="root"
        className={cn(
          'inline-flex items-start gap-2 select-none',
          disabled && 'cursor-not-allowed opacity-60',
          !disabled && 'cursor-pointer',
        )}
      >
        {control}
        <span data-slot="text" className="flex flex-col">
          <span className={cn('font-medium text-foreground', dims.label)}>{label}</span>
          {supportingText && (
            <span className={cn('text-muted-foreground', dims.support)}>{supportingText}</span>
          )}
        </span>
      </label>
    );
  },
);

export default CustomRadio;

// ── Group variant ────────────────────────────────────────────────────────────

export interface RadioOption<TValue extends string = string> {
  label: string;
  value: TValue;
  disabled?: boolean;
  supportingText?: string;
}

export interface CustomRadioGroupProps<TValue extends string = string> {
  name: string;
  value?: TValue;
  defaultValue?: TValue;
  options: RadioOption<TValue>[];
  onChange?: (next: TValue) => void;
  onBlur?: () => void;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md';
  disabled?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  className?: string;
}

export function CustomRadioGroup<TValue extends string = string>({
  name,
  value,
  defaultValue,
  options,
  onChange,
  onBlur,
  orientation = 'vertical',
  size = 'sm',
  disabled,
  hasError,
  errorMessage,
  className,
}: CustomRadioGroupProps<TValue>) {
  const helperId = `${name}-helper`;
  const dims = sizeMap[size];

  return (
    <div data-slot="root" className="flex flex-col">
      <RadioGroupPrimitive.Root
        name={name}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => onChange?.(next as TValue)}
        onBlur={onBlur}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? helperId : undefined}
        className={cn(
          'flex',
          orientation === 'vertical' ? 'flex-col gap-2' : 'flex-row flex-wrap gap-4',
          className,
        )}
      >
        {options.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              'inline-flex items-start gap-2 select-none',
              (disabled || opt.disabled) && 'cursor-not-allowed opacity-60',
              !(disabled || opt.disabled) && 'cursor-pointer',
            )}
          >
            <RadioGroupPrimitive.Item
              value={opt.value}
              disabled={disabled || opt.disabled}
              className={cn(
                'inline-flex shrink-0 items-center justify-center rounded-full border border-input bg-background',
                'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                'data-[state=checked]:border-primary',
                'disabled:cursor-not-allowed disabled:opacity-60',
                hasError && 'border-destructive',
                dims.outer,
              )}
            >
              <RadioGroupPrimitive.Indicator className={cn('rounded-full bg-primary', dims.inner)} />
            </RadioGroupPrimitive.Item>
            <span className="flex flex-col">
              <span className={cn('font-medium text-foreground', dims.label)}>{opt.label}</span>
              {opt.supportingText && (
                <span className={cn('text-muted-foreground', dims.support)}>{opt.supportingText}</span>
              )}
            </span>
          </label>
        ))}
      </RadioGroupPrimitive.Root>
      {hasError && errorMessage && (
        <p id={helperId} role="alert" className="mt-1 text-xs leading-tight text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
