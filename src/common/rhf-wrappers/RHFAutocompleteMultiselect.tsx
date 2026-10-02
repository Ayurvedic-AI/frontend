import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import {
  CustomAutocompleteMultiselect,
  type CustomAutocompleteMultiselectProps,
} from '../custom-autocomplete-multiselect';

export interface RHFAutocompleteMultiselectProps<TFieldValues extends FieldValues>
  extends Omit<
    CustomAutocompleteMultiselectProps,
    'value' | 'onChange' | 'hasError' | 'errorMessage'
  > {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
}

export function RHFAutocompleteMultiselect<TFieldValues extends FieldValues>(
  props: RHFAutocompleteMultiselectProps<TFieldValues>,
) {
  const { name, control, ...rest } = props;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <CustomAutocompleteMultiselect
          {...rest}
          value={(field.value as string[] | undefined) ?? []}
          onChange={(keys) => field.onChange(keys)}
          hasError={Boolean(fieldState.error)}
          errorMessage={fieldState.error?.message}
        />
      )}
    />
  );
}
