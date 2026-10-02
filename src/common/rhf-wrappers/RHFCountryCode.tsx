import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import {
  CountryCodeAutocomplete,
  type CountryCodeAutocompleteProps,
} from '../country-code';

export interface RHFCountryCodeProps<TFieldValues extends FieldValues>
  extends Omit<CountryCodeAutocompleteProps, 'value' | 'onChange'> {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
}

export function RHFCountryCode<TFieldValues extends FieldValues>(
  props: RHFCountryCodeProps<TFieldValues>,
) {
  const { name, control, ...rest } = props;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <CountryCodeAutocomplete
          {...rest}
          value={(field.value as string | undefined) ?? ''}
          onChange={(v) => field.onChange(v)}
        />
      )}
    />
  );
}
