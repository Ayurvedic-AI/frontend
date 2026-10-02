import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import dayjs, { type Dayjs } from 'dayjs';
import { DatePickerField, type DatePickerProps } from '../date-picker-field';
import { CustomLabel } from '../custom-label';

export interface RHFDatePickerProps<TFieldValues extends FieldValues>
  extends Omit<DatePickerProps, 'value' | 'onChange' | 'hasError' | 'errorMessage' | 'name' | 'label'> {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
  /** Label rendered ABOVE the field, consistent with RHFInput/RHFSelect. */
  label?: React.ReactNode;
  /** Shows the required asterisk on the label. */
  required?: boolean;
  /** In-field placeholder shown when empty (defaults to "Select date"). */
  placeholder?: string;
}

export function RHFDatePicker<TFieldValues extends FieldValues>(
  props: RHFDatePickerProps<TFieldValues>,
) {
  const { name, control, label, required, placeholder, ...rest } = props;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="flex w-full flex-col">
          {label && <CustomLabel label={label} htmlFor={name} isRequired={required} />}
          <DatePickerField
            {...rest}
            name={name}
            label={placeholder ?? 'Select date'}
            value={field.value ? dayjs(field.value as string | Date) : null}
            // Emit a plain local calendar date (YYYY-MM-DD), NOT toISOString():
            // every consumer validates `^\d{4}-\d{2}-\d{2}$`, and toISOString()
            // both adds a time component and shifts the day to UTC (#115, #114).
            onChange={(date: Dayjs | null) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
            hasError={Boolean(fieldState.error)}
            errorMessage={fieldState.error?.message}
          />
        </div>
      )}
    />
  );
}
