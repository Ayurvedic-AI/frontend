import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { CustomSelect, type CustomSelectProps } from '../custom-select';
import { CustomLabel } from '../custom-label';

export interface RHFSelectProps<TFieldValues extends FieldValues>
  extends Omit<
    CustomSelectProps,
    'value' | 'onChange' | 'hasError' | 'errorMessage' | 'name'
  > {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
  label?: React.ReactNode;
  required?: boolean;
}

export function RHFSelect<TFieldValues extends FieldValues>(
  props: RHFSelectProps<TFieldValues>,
) {
  const { name, control, label, required, ...rest } = props;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="flex w-full flex-col">
          {label && <CustomLabel label={label} htmlFor={name} isRequired={required} />}
          <CustomSelect
            {...rest}
            name={field.name}
            value={(field.value as string | undefined) ?? ''}
            onChange={(e) => field.onChange(e.target.value)}
            hasError={Boolean(fieldState.error)}
            errorMessage={fieldState.error?.message}
          />
        </div>
      )}
    />
  );
}
