import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn';

export interface CustomCheckboxProps {
  /** Controlled checked state. */
  checked?: boolean;
  /** Indeterminate visual state (overrides `checked` visually). */
  indeterminate?: boolean;
  /** Disabled flag. */
  disabled?: boolean;
  /** Visual size. */
  size?: 'sm' | 'md';
  /** Label text rendered next to the checkbox. */
  label?: string;
  /** Smaller text below the label. */
  supportingText?: string;
  /** Hide the label/text region; show only the checkbox. */
  showText?: boolean;
  /** Fired with the next checked value when the user toggles. */
  onChange?: (checked: boolean) => void;
  /** Wrapper className. */
  className?: string;
  /** Test identifier. */
  'data-testid'?: string;
  /** Forwarded to the underlying control. */
  id?: string;
  /** Forwarded to the underlying control. */
  name?: string;
}

const sizeMap = {
  sm: { box: 'size-4 rounded', icon: 'size-3', label: 'text-sm', support: 'text-xs' },
  md: { box: 'size-5 rounded-md', icon: 'size-3.5', label: 'text-base', support: 'text-sm' },
} as const;

export const CustomCheckbox = forwardRef<HTMLButtonElement, CustomCheckboxProps>(
  function CustomCheckbox(
    {
      checked = false,
      indeterminate = false,
      disabled = false,
      size = 'sm',
      label,
      supportingText,
      showText = true,
      onChange,
      className,
      'data-testid': testId,
      id: idProp,
      name,
    },
    ref,
  ) {
    const autoId = useId();
    const id = idProp ?? autoId;
    const dims = sizeMap[size];
    const renderedChecked: CheckboxPrimitive.CheckedState = indeterminate
      ? 'indeterminate'
      : checked;

    // When the visible text region is hidden (showText=false), the wrapping
    // <label> no longer names the control — so surface `label` as aria-label,
    // otherwise a screen reader announces a nameless "checkbox" (e.g. the R&P
    // permission grid, where every box renders bare).
    const ariaLabel = showText && label ? undefined : label;

    const control = (
      <CheckboxPrimitive.Root
        ref={ref}
        id={id}
        name={name}
        aria-label={ariaLabel}
        checked={renderedChecked}
        disabled={disabled}
        onCheckedChange={(next) => {
          if (next === 'indeterminate') return;
          onChange?.(Boolean(next));
        }}
        data-slot="control"
        data-testid={testId}
        className={cn(
          'inline-flex shrink-0 items-center justify-center border border-input bg-background text-primary-foreground',
          'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          'data-[state=checked]:bg-primary data-[state=checked]:border-primary',
          'data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary',
          'disabled:cursor-not-allowed disabled:opacity-60',
          dims.box,
          className,
        )}
      >
        <CheckboxPrimitive.Indicator
          data-slot="indicator"
          className="flex items-center justify-center"
        >
          {indeterminate ? (
            <Minus aria-hidden="true" className={dims.icon} strokeWidth={3} />
          ) : (
            <Check aria-hidden="true" className={dims.icon} strokeWidth={3} />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
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

export default CustomCheckbox;
