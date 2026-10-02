import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { CSSProperties, PropsWithChildren } from 'react';
import { cn } from '../../lib/cn';

type DrawerAnchor = 'left' | 'top' | 'right' | 'bottom';
type DrawerWidth = string | Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string>>;

export interface DrawerProps {
  anchor: DrawerAnchor;
  open: boolean;
  title?: string;
  drawerWidth?: DrawerWidth;
  drawermargin?: string;
  drawerPadding?: string;
  /** Padding for the header region only. */
  headerPadding?: string;
  onClose?: () => void;
  /** Legacy `mt` passthrough (margin-top) for the header. */
  headerStyle?: string;
  titleStyle?: CSSProperties;
  className?: string;
}

function widthString(w?: DrawerWidth): string | undefined {
  if (!w) return undefined;
  if (typeof w === 'string') return w;
  return w.md ?? w.lg ?? w.sm ?? w.xs ?? w.xl ?? Object.values(w)[0];
}

const CustomDrawer = ({
  anchor,
  open,
  title,
  drawerWidth,
  drawermargin,
  drawerPadding,
  onClose,
  headerStyle,
  titleStyle,
  className,
  children,
}: PropsWithChildren<DrawerProps>) => {
  const slideClasses: Record<DrawerAnchor, string> = {
    right: 'right-0 top-0 h-full max-h-screen translate-x-0 data-[state=closed]:translate-x-full data-[state=open]:translate-x-0',
    left: 'left-0 top-0 h-full max-h-screen translate-x-0 data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0',
    top: 'left-0 top-0 w-full data-[state=closed]:-translate-y-full data-[state=open]:translate-y-0',
    bottom: 'bottom-0 left-0 w-full data-[state=closed]:translate-y-full data-[state=open]:translate-y-0',
  };

  // Responsive default sizing: full screen on phones, narrower on larger screens.
  const sizeStyle: CSSProperties = (() => {
    const w = widthString(drawerWidth);
    if (anchor === 'right' || anchor === 'left') {
      return { width: w ?? undefined, maxWidth: '100vw' };
    }
    return { height: w ?? 'auto' };
  })();

  const defaultPad = drawerPadding ?? '24px';

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose?.();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-slot="overlay"
          className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out"
        />
        <DialogPrimitive.Content
          data-slot="content"
          data-anchor={anchor}
          // Feature 046: a click/interaction on the dimmed backdrop must NOT dismiss the
          // drawer (FR-001/FR-007). Only the ✕, Cancel, Submit, and Escape close it.
          // Escape stays active because it is handled separately via onEscapeKeyDown (FR-009).
          onInteractOutside={(event) => event.preventDefault()}
          style={sizeStyle}
          className={cn(
            'fixed z-50 flex flex-col overflow-hidden bg-background shadow-xl transition-transform',
            // Default sensible widths per breakpoint when consumer didn't set one.
            !drawerWidth && (anchor === 'left' || anchor === 'right') && 'w-full sm:w-[90vw] md:w-[50vw] lg:w-[40vw]',
            slideClasses[anchor],
            className,
          )}
        >
          {title && (
            <header
              data-slot="header"
              className="flex items-center justify-between border-b border-border"
              style={{
                marginTop: headerStyle,
                paddingLeft: 10,
                paddingRight: 10,
                paddingTop: 15,
                paddingBottom: 15,
              }}
            >
              <DialogPrimitive.Title
                data-slot="title"
                title={title}
                className="min-w-0 flex-1 truncate text-base font-semibold leading-tight sm:text-lg md:text-xl"
                style={titleStyle}
              >
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  aria-label="Close drawer"
                  onClick={onClose}
                  // Radix auto-focuses this button on open; without a styled
                  // focus-visible state the browser paints its default black
                  // outline on keyboard-initiated opens (app-wide ring idiom).
                  className="ml-2 shrink-0 rounded p-1 text-muted-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </DialogPrimitive.Close>
            </header>
          )}
          <div
            data-slot="body"
            className="flex-1 overflow-auto"
            style={{
              padding: defaultPad,
              margin: drawermargin,
            }}
          >
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default CustomDrawer;
export { CustomDrawer };
