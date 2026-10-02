import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { CustomInput, type CustomInputProps } from '../custom-input';
import { CustomLabel } from '../custom-label';

export interface RHFInputProps<TFieldValues extends FieldValues>
  extends Omit<
    CustomInputProps,
    'value' | 'onChange' | 'hasError' | 'errorMessage' | 'name'
  > {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
  /** Optional label rendered above the input via `CustomLabel`. */
  label?: React.ReactNode;
  /** Auto-uppercase the value as the user types (identifier/code/GSTIN fields). */
  uppercase?: boolean;
  /** Allow digits only — strips non-numeric input as you type (pair with `maxLength`). */
  numeric?: boolean;
}

export function RHFInput<TFieldValues extends FieldValues>(
  props: RHFInputProps<TFieldValues>,
) {
  const { name, control, label, required, uppercase, numeric, ...rest } = props;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="flex w-full flex-col">
          {label && <CustomLabel label={label} htmlFor={name} isRequired={required} />}
          <CustomInput
            {...rest}
            required={required}
            name={field.name}
            id={name}
            value={(field.value as string | number | undefined) ?? ''}
            onChange={(e) => {
              let v = e.target.value;
              if (numeric) v = v.replace(/\D/g, '');
              else if (uppercase) v = v.toUpperCase();
              field.onChange(v);
            }}
            hasError={Boolean(fieldState.error)}
            errorMessage={fieldState.error?.message}
          />
        </div>
      )}
    />
  );
}
