import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { forwardRef } from 'react';
import { CustomButton, type CustomButtonProps } from '../../../common/custom-buttons';
import { cn } from '../../../lib/cn';
import { usePermissions } from './use-permissions';

export interface PermissionButtonProps extends CustomButtonProps {
  /** The catalog permission this action requires (nearest-CRUD-verb mapping, FR-017a). */
  permission: string;
  /** Tooltip shown when the user lacks the permission. */
  deniedTooltip?: string;
}

const DEFAULT_DENIED = "You don't have permission to perform this action";

/**
 * Permission-aware action button (feature 039, FR-017/FR-018).
 *
 * Holds the permission → a normal {@link CustomButton}. Lacks it → the button is
 * rendered DISABLED (so it can't be clicked or keyboard-activated) and wrapped in
 * a tooltip explaining why. The button is made `pointer-events-none` and the
 * wrapping span carries the hover/focus, which is the Radix workaround for showing
 * a tooltip on an otherwise event-swallowing disabled control.
 *
 * Lives in the auth/permissions feature (not `src/common`) because it depends on
 * `usePermissions`; it composes the presentational `CustomButton` from `src/common`.
 */
export const PermissionButton = forwardRef<HTMLButtonElement, PermissionButtonProps>(
  function PermissionButton(
    { permission, deniedTooltip = DEFAULT_DENIED, className, disabled, ...rest },
    ref,
  ) {
    const { has } = usePermissions();

    if (has(permission)) {
      return <CustomButton ref={ref} className={className} disabled={disabled} {...rest} />;
    }

    return (
      <TooltipPrimitive.Provider delayDuration={200}>
        <TooltipPrimitive.Root>
          <TooltipPrimitive.Trigger asChild>
            <span data-slot="permission-denied" tabIndex={0} className="inline-flex">
              <CustomButton
                ref={ref}
                disabled
                aria-disabled
                className={cn('pointer-events-none', className)}
                {...rest}
              />
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
              {deniedTooltip}
              <TooltipPrimitive.Arrow className="fill-foreground" />
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>
    );
  },
);

export default PermissionButton;
