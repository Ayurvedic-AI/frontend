import type { CSSProperties, ReactNode } from 'react';
import { CustomDialog } from '../custom-dialog';
import { CustomButton } from '../custom-buttons';

export interface ConfirmationPopUpProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: ReactNode;
  sx?: CSSProperties;
  /** Disable the confirm button when true. */
  confirmDisabled?: boolean;
  /** Optional error/helper message shown under the main message. */
  errorMessage?: string | null;
  /** Optional override for the dialog title (default: "Confirm"). */
  title?: ReactNode;
  /** Optional override for the confirm button label. */
  confirmLabel?: string;
  /** Optional override for the cancel button label. */
  cancelLabel?: string;
  /** When true, renders the confirm button in the destructive variant. */
  destructive?: boolean;
}

const ConfirmationPopUp = ({
  open,
  onClose,
  onConfirm,
  message,
  sx,
  confirmDisabled,
  errorMessage,
  title = 'Confirm',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
}: ConfirmationPopUpProps) => {
  return (
    <CustomDialog
      title={title}
      open={open}
      onClose={() => onClose()}
      width={480}
      sx={sx}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed">
          {message || 'Do you really want to go ahead with this operation?'}
        </p>
        {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <CustomButton
            type="button"
            variant="outline"
            onClick={() => onClose()}
          >
            {cancelLabel}
          </CustomButton>
          <CustomButton
            type="button"
            variant={destructive ? 'destructive' : 'primary'}
            disabled={Boolean(confirmDisabled)}
            onClick={() => onConfirm()}
          >
            {confirmLabel}
          </CustomButton>
        </div>
      </div>
    </CustomDialog>
  );
};

export default ConfirmationPopUp;
export { ConfirmationPopUp };
