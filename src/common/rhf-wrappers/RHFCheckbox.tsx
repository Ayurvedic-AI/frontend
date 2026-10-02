import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { CustomCheckbox, type CustomCheckboxProps } from '../custom-checkbox';

export interface RHFCheckboxProps<TFieldValues extends FieldValues>
  extends Omit<CustomCheckboxProps, 'checked' | 'onChange' | 'name'> {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
}

export function RHFCheckbox<TFieldValues extends FieldValues>(
  props: RHFCheckboxProps<TFieldValues>,
) {
  const { name, control, ...rest } = props;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <CustomCheckbox
          {...rest}
          id={name}
          name={field.name}
          checked={Boolean(field.value)}
          onChange={(next) => field.onChange(next)}
        />
      )}
    />
  );
}
