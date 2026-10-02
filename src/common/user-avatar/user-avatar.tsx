import { Loader2 } from 'lucide-react';
import { useEffect, useReducer, type CSSProperties } from 'react';
import { cn } from '../../lib/cn';

export type UserAvatarVariant = 'solid' | 'soft';

export interface UserAvatarProps {
  /** Presigned image URL. If omitted/null, renders initials. */
  src?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  /** Square size in px. Default 28 (table rows). */
  size?: number;
  /**
   * 'solid' (default): primary background + light text.
   * 'soft': light primary background + primary text (e.g. navbar).
   */
  variant?: UserAvatarVariant;
  /** Inline style escape hatch (legacy `sx` passthrough). */
  sx?: CSSProperties;
  onClick?: () => void;
  className?: string;
}

function initialsOf(first?: string | null, last?: string | null): string {
  const f = (first || '').trim()[0] || '';
  const l = (last || '').trim()[0] || '';
  return (f + l).toUpperCase() || '?';
}

function fontSizeFor(size: number): string {
  if (size <= 32) return '12px';
  if (size <= 64) return '16px';
  if (size <= 88) return '22px';
  return '28px';
}

interface ImgState {
  readySrc: string | null;
  loading: boolean;
}
type ImgAction =
  | { type: 'START_LOAD' }
  | { type: 'LOADED'; src: string }
  | { type: 'RESET' };

function imgReducer(_state: ImgState, action: ImgAction): ImgState {
  switch (action.type) {
    case 'START_LOAD':
      return { readySrc: null, loading: true };
    case 'LOADED':
      return { readySrc: action.src, loading: false };
    case 'RESET':
      return { readySrc: null, loading: false };
  }
}

export function UserAvatar({
  src,
  firstName,
  lastName,
  size = 28,
  variant = 'solid',
  sx,
  onClick,
  className,
}: UserAvatarProps) {
  const [{ readySrc, loading }, dispatch] = useReducer(imgReducer, {
    readySrc: null,
    loading: false,
  });

  useEffect(() => {
    if (!src) {
      dispatch({ type: 'RESET' });
      return;
    }
    dispatch({ type: 'START_LOAD' });
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      dispatch({ type: 'LOADED', src });
    };
    img.onerror = () => {
      if (cancelled) return;
      dispatch({ type: 'RESET' });
    };
    img.src = src;
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  const spinnerSize = Math.max(14, Math.floor(size / 3));
  const variantClasses =
    variant === 'soft'
      ? 'bg-primary/10 text-primary'
      : 'bg-primary-05 text-primary-foreground';

  return (
    <span
      onClick={onClick}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold',
        onClick && 'cursor-pointer',
        variantClasses,
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: fontSizeFor(size),
        ...sx,
      }}
      data-slot="root"
      data-variant={variant}
    >
      {readySrc ? (
        <img
          src={readySrc}
          alt={`${firstName ?? ''} ${lastName ?? ''}`.trim() || 'User avatar'}
          className="h-full w-full object-cover"
          data-slot="image"
        />
      ) : (
        <span data-slot="fallback">{initialsOf(firstName, lastName)}</span>
      )}

      {loading && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-background/60"
        >
          <Loader2 className="animate-spin text-primary" style={{ width: spinnerSize, height: spinnerSize }} />
        </span>
      )}
    </span>
  );
}

export default UserAvatar;
