import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { MoreVertical } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface ActionMenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** Optional foreground color (e.g. for destructive items). Tailwind class or CSS color. */
  color?: string;
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
  ariaLabel?: string;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Optional override for the trigger element (defaults to a `MoreVertical` icon button). */
  trigger?: ReactNode;
  className?: string;
}

export function ActionMenu({
  items,
  ariaLabel = 'Actions',
  align = 'end',
  side = 'bottom',
  trigger,
  className,
}: ActionMenuProps) {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        {trigger ?? (
          <button
            type="button"
            aria-label={ariaLabel}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              className,
            )}
          >
            <MoreVertical aria-hidden className="size-4" />
          </button>
        )}
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={align}
          side={side}
          sideOffset={4}
          className={cn(
            'z-50 min-w-[8.75rem] overflow-hidden rounded-lg border border-border bg-background p-1 shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          )}
        >
          {items.map((item) => (
            <DropdownMenuPrimitive.Item
              key={item.label}
              disabled={item.disabled}
              onSelect={() => {
                if (!item.disabled) item.onClick();
              }}
              className={cn(
                'flex cursor-pointer select-none items-center gap-2 rounded px-3 py-2 text-sm outline-none',
                'data-[highlighted]:bg-secondary data-[highlighted]:text-secondary-foreground',
                'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
              )}
              style={item.color ? { color: item.color } : undefined}
            >
              {item.icon && (
                <span aria-hidden className="flex size-4 items-center justify-center">
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
            </DropdownMenuPrimitive.Item>
          ))}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

export default ActionMenu;
