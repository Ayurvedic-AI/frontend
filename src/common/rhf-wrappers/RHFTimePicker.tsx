import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { TimePickerField, type TimePickerFieldProps } from '../time-picker-field';

export interface RHFTimePickerProps<TFieldValues extends FieldValues>
  extends Omit<TimePickerFieldProps, 'value' | 'onChange' | 'hasError' | 'errorMessage'> {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
}

export function RHFTimePicker<TFieldValues extends FieldValues>(
  props: RHFTimePickerProps<TFieldValues>,
) {
  const { name, control, ...rest } = props;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TimePickerField
          {...rest}
          value={(field.value as string | undefined) ?? ''}
          onChange={(v) => field.onChange(v)}
          hasError={Boolean(fieldState.error)}
          errorMessage={fieldState.error?.message}
        />
      )}
    />
  );
}
