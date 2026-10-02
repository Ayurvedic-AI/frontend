import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * Variant + size definitions. The list of variants intentionally includes the
 * legacy domain-specific ones (`icon`, `floating`, `black-filled`) so existing
 * call sites keep compiling.
 */
const buttonVariants = cva(
  // base
  cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium',
    'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ),
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline:
          'border border-input bg-background text-foreground hover:bg-secondary hover:text-secondary-foreground',
        ghost: 'bg-transparent text-foreground hover:bg-secondary',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        success: 'bg-positive text-positive-foreground hover:bg-positive/90',
        icon: 'bg-transparent text-foreground hover:bg-secondary p-0',
        floating:
          'bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 rounded-full',
        'black-filled': 'bg-foreground text-background hover:bg-foreground/90',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-base', // ≥44 px tap target (constitution Principle V)
        lg: 'h-12 px-6 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    compoundVariants: [
      // Icon-only buttons get square sizing instead of horizontal padding.
      { variant: 'icon', size: 'sm', class: 'size-9 p-0' },
      { variant: 'icon', size: 'md', class: 'size-11 p-0' },
      { variant: 'icon', size: 'lg', class: 'size-12 p-0' },
      { variant: 'floating', size: 'sm', class: 'size-9 p-0' },
      { variant: 'floating', size: 'md', class: 'size-11 p-0' },
      { variant: 'floating', size: 'lg', class: 'size-14 p-0' },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
);

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;

export interface CustomButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    VariantProps<typeof buttonVariants> {
  children?: ReactNode;
  /** Renders a spinner and disables clicks. Children stay in place to avoid layout shift. */
  loading?: boolean;
  /** Optional icon node. Renders on left or right based on `iconPosition`. */
  icon?: ReactNode;
  /** Where to place `icon` relative to the children. */
  iconPosition?: 'left' | 'right';
  /** Render the variant's classes onto the immediate child (e.g. an <a>) instead of a <button>. */
  asChild?: boolean;
  /** Legacy escape hatch — merged into `className`. */
  sx?: React.CSSProperties;
  'data-testid'?: string;
}

export const CustomButton = forwardRef<HTMLButtonElement, CustomButtonProps>(
  function CustomButton(
    {
      children,
      variant,
      size,
      fullWidth,
      loading = false,
      disabled,
      icon,
      iconPosition = 'left',
      asChild = false,
      className,
      sx,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    const content = (
      <>
        {loading && (
          <Loader2
            aria-hidden="true"
            data-slot="spinner"
            className="size-4 animate-spin"
          />
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span data-slot="icon" data-position="left">
            {icon}
          </span>
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && (
          <span data-slot="icon" data-position="right">
            {icon}
          </span>
        )}
      </>
    );

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        data-slot="root"
        data-variant={variant ?? 'primary'}
        data-size={size ?? 'md'}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        style={sx}
        {...rest}
      >
        {content}
      </Comp>
    );
  },
);

export default CustomButton;
