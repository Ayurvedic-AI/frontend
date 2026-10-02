import { Leaf } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  /** Render only the icon mark (tight spaces). */
  iconOnly?: boolean;
  /** Use light wordmark on dark/primary surfaces. */
  inverted?: boolean;
  className?: string;
}

const MARK = { sm: 'size-7 rounded-md', md: 'size-9 rounded-lg', lg: 'size-12 rounded-xl' };
const ICON = { sm: 'size-4', md: 'size-5', lg: 'size-7' };
const TEXT = { sm: 'text-base', md: 'text-lg', lg: 'text-2xl' };

/** Product mark + wordmark. Single source of the brand — never inline a logo elsewhere. */
export function BrandLogo({ size = 'md', iconOnly, inverted, className }: BrandLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)} data-slot="brand-logo">
      <span
        className={cn(
          'inline-flex shrink-0 items-center justify-center',
          inverted ? 'bg-white/15 text-white' : 'bg-primary text-primary-foreground',
          MARK[size],
        )}
      >
        <Leaf aria-hidden className={ICON[size]} />
      </span>
      {!iconOnly && (
        <span
          className={cn(
            'font-semibold tracking-tight',
            inverted ? 'text-white' : 'text-foreground',
            TEXT[size],
          )}
        >
          Ayurveda AI
        </span>
      )}
    </span>
  );
}
