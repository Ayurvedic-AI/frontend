import * as LabelPrimitive from '@radix-ui/react-label';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';
import { memo, type CSSProperties, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface CustomLabelProps {
  /** Label text or node. */
  label: ReactNode;
  /**
   * Adds a "*" indicator (visual only — actual validation lives in the
   * consumer's Zod schema).
   */
  isRequired?: boolean;
  /** Forwarded to `htmlFor` on the underlying <label>. */
  htmlFor?: string;
  /** Optional inline style passthrough (legacy compatibility). */
  style?: CSSProperties;
  /** Visual size. */
  size?: 'sm' | 'md' | 'lg';
  /** Optional tooltip rendered next to the label as an info icon. */
  tooltip?: ReactNode;
  /** Additional Tailwind classes for the wrapper. */
  className?: string;
}

const sizeClasses: Record<NonNullable<CustomLabelProps['size']>, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

function CustomLabelBase({
  label,
  isRequired,
  htmlFor,
  style,
  size = 'md',
  tooltip,
  className,
}: CustomLabelProps) {
  const labelEl = (
    <LabelPrimitive.Root
      htmlFor={htmlFor}
      data-slot="label"
      className={cn(
        'inline-flex items-center gap-1 font-medium leading-tight text-foreground select-none',
        sizeClasses[size],
        className,
      )}
      style={style}
    >
      {label}
      {isRequired && (
        <span
          aria-hidden="true"
          data-slot="required-indicator"
          className="text-destructive"
        >
          *
        </span>
      )}
      {tooltip && (
        <TooltipPrimitive.Provider delayDuration={200}>
          <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger asChild>
              <span
                data-slot="tooltip-trigger"
                className="ml-0.5 inline-flex cursor-help text-muted-foreground hover:text-foreground"
              >
                <Info aria-hidden="true" className="size-3.5" />
              </span>
            </TooltipPrimitive.Trigger>
            <TooltipPrimitive.Portal>
              <TooltipPrimitive.Content
                sideOffset={6}
                data-slot="tooltip-content"
                className={cn(
                  'z-50 max-w-xs rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-md',
                  'data-[state=delayed-open]:animate-in data-[state=closed]:animate-out',
                  'data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0',
                )}
              >
                {tooltip}
                <TooltipPrimitive.Arrow className="fill-foreground" />
              </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
          </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
      )}
    </LabelPrimitive.Root>
  );

  return <div className="mb-1">{labelEl}</div>;
}

export const CustomLabel = memo(CustomLabelBase);
CustomLabel.displayName = 'CustomLabel';

export default CustomLabel;
