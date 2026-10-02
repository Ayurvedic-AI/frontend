import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { CustomRadioGroup, type CustomRadioGroupProps } from '../custom-radio';
import { CustomLabel } from '../custom-label';

export interface RHFRadioGroupProps<TFieldValues extends FieldValues, TValue extends string = string>
  extends Omit<
    CustomRadioGroupProps<TValue>,
    'value' | 'onChange' | 'onBlur' | 'hasError' | 'errorMessage' | 'name'
  > {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
  label?: React.ReactNode;
  required?: boolean;
}

export function RHFRadioGroup<TFieldValues extends FieldValues, TValue extends string = string>(
  props: RHFRadioGroupProps<TFieldValues, TValue>,
) {
  const { name, control, label, required, ...rest } = props;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className="flex w-full flex-col">
          {label && <CustomLabel label={label} isRequired={required} />}
          <CustomRadioGroup<TValue>
            {...rest}
            name={field.name}
            value={field.value as TValue | undefined}
            onChange={(next) => field.onChange(next)}
            onBlur={field.onBlur}
            hasError={Boolean(fieldState.error)}
            errorMessage={fieldState.error?.message}
          />
        </div>
      )}
    />
  );
}
