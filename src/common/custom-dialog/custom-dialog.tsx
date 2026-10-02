import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { CSSProperties, PropsWithChildren, ReactNode, SyntheticEvent } from 'react';
import { cn } from '../../lib/cn';

export interface CustomDialogProps {
  title: ReactNode;
  open: boolean;
  /**
   * Fires when the dialog is dismissed. The legacy MUI shape included optional
   * `event` and `reason` arguments; we keep the same signature so existing
   * consumers don't need to change their callbacks.
   */
  onClose: (
    event?: SyntheticEvent,
    reason?: 'backdropClick' | 'escapeKeyDown',
  ) => void;
  /** Width passthrough (string, number, or breakpoint record — legacy compat). */
  width?: string | number | Record<string, string | number>;
  /** Height passthrough. */
  height?: string | number | Record<string, string | number>;
  /** Inline style escape hatch for the content paper. */
  sx?: CSSProperties;
  /** Overflow on the body region. */
  overFlow?: string;
  /** Padding on the body region. */
  padding?: string;
  /** Optional className for the content paper. */
  className?: string;
}

/**
 * Strip a width/height passthrough to a flat px/rem value when possible.
 * Breakpoint records lose their responsive granularity — consumers using the
 * record form should pass `className` instead.
 */
function flatten(v?: string | number | Record<string, string | number>): string | number | undefined {
  if (v == null) return undefined;
  if (typeof v === 'string' || typeof v === 'number') return v;
  return v.sm ?? v.md ?? v.lg ?? v.xl ?? Object.values(v)[0];
}

const CustomDialog = ({
  title,
  open,
  onClose,
  width,
  height,
  sx,
  overFlow,
  padding,
  className,
  children,
}: PropsWithChildren<CustomDialogProps>) => {
  const widthFlat = flatten(width);
  const heightFlat = flatten(height);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-slot="overlay"
          onClick={(e) => onClose(e, 'backdropClick')}
          className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          data-slot="content"
          onEscapeKeyDown={(e) => onClose(e as unknown as SyntheticEvent, 'escapeKeyDown')}
          style={{
            width: widthFlat,
            maxWidth: widthFlat ?? '90vw',
            height: heightFlat,
            ...sx,
          }}
          className={cn(
            'fixed left-1/2 top-1/2 z-50 max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-border bg-background shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            className,
          )}
        >
          <header data-slot="header" className="flex items-center justify-between border-b border-border px-5 py-4">
            <DialogPrimitive.Title data-slot="title" className="text-lg font-semibold leading-snug">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                aria-label="close"
                data-slot="close"
                onClick={(e) => onClose(e)}
                className="rounded p-1 text-muted-foreground hover:bg-secondary"
              >
                <X aria-hidden className="size-4" />
              </button>
            </DialogPrimitive.Close>
          </header>
          <div
            data-slot="body"
            className="overflow-auto p-5"
            style={{
              overflow: overFlow,
              padding: padding ?? undefined,
            }}
          >
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default CustomDialog;
export { CustomDialog };
