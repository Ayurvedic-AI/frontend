import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { CustomMultiSelect, type CustomMultiSelectProps } from '../custom-multiselect';

export interface RHFMultiselectProps<TFieldValues extends FieldValues>
  extends Omit<CustomMultiSelectProps, 'value' | 'onChange'> {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
}

export function RHFMultiselect<TFieldValues extends FieldValues>(
  props: RHFMultiselectProps<TFieldValues>,
) {
  const { name, control, ...rest } = props;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <CustomMultiSelect
          {...rest}
          value={(field.value as string[] | undefined) ?? []}
          onChange={(keys) => field.onChange(keys)}
        />
      )}
    />
  );
}
