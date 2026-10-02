import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { CustomAutoComplete, type CustomAutoCompleteProps } from '../custom-auto-complete';

export interface RHFAutocompleteProps<TFieldValues extends FieldValues>
  extends Omit<CustomAutoCompleteProps, 'value' | 'onChange' | 'hasError' | 'errorMessage'> {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
}

export function RHFAutocomplete<TFieldValues extends FieldValues>(
  props: RHFAutocompleteProps<TFieldValues>,
) {
  const { name, control, ...rest } = props;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <CustomAutoComplete
          {...rest}
          value={(field.value as string | undefined) ?? ''}
          onChange={(key) => field.onChange(key)}
          hasError={Boolean(fieldState.error)}
          errorMessage={fieldState.error?.message}
        />
      )}
    />
  );
}
