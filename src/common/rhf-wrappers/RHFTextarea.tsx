import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { CustomTextArea, type CustomTextAreaProps } from '../custom-text-area';
import { CustomLabel } from '../custom-label';

export interface RHFTextareaProps<TFieldValues extends FieldValues>
  extends Omit<
    CustomTextAreaProps,
    'value' | 'onChange' | 'onBlur' | 'hasError' | 'errorMessage' | 'name'
  > {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
  label?: React.ReactNode;
  required?: boolean;
}

export function RHFTextarea<TFieldValues extends FieldValues>(
  props: RHFTextareaProps<TFieldValues>,
) {
  const { name, control, label, required, ...rest } = props;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="flex w-full flex-col">
          {label && <CustomLabel label={label} htmlFor={name} isRequired={required} />}
          <CustomTextArea
            {...rest}
            name={field.name}
            value={(field.value as string | number | undefined) ?? ''}
            onChange={(e) => field.onChange(e.target.value)}
            onBlur={field.onBlur}
            hasError={Boolean(fieldState.error)}
            errorMessage={fieldState.error?.message}
          />
        </div>
      )}
    />
  );
}
