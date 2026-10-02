import { useRef } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { SignatureCanvas, type SignatureCanvasProps, type SignatureCanvasRef } from '../signature-canvas';
import { CustomButton } from '../custom-buttons';

export interface RHFSignatureCanvasProps<TFieldValues extends FieldValues>
  extends Omit<SignatureCanvasProps, 'onSignatureChange' | 'onDrawEnd'> {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
  clearLabel?: string;
}

/**
 * Form-aware signature canvas. The form value is a data-URL string (PNG) or
 * an empty string when no signature is captured. Uses the underlying
 * canvas's imperative API to populate the form value on each stroke end and
 * to clear when the consumer presses the clear button.
 */
export function RHFSignatureCanvas<TFieldValues extends FieldValues>(
  props: RHFSignatureCanvasProps<TFieldValues>,
) {
  const { name, control, clearLabel = 'Clear', ...rest } = props;
  const ref = useRef<SignatureCanvasRef>(null);
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="flex flex-col gap-2">
          <SignatureCanvas
            {...rest}
            ref={ref}
            onDrawEnd={() => {
              const data = ref.current?.getSignatureData();
              field.onChange(data ?? '');
            }}
            onSignatureChange={(isEmpty) => {
              if (isEmpty) field.onChange('');
            }}
          />
          <div className="flex justify-end">
            <CustomButton
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                ref.current?.clearCanvas();
                field.onChange('');
              }}
            >
              {clearLabel}
            </CustomButton>
          </div>
        </div>
      )}
    />
  );
}
