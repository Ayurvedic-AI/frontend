import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { CustomSearchFilter, type SearchFilterProps } from '../custom-search';

export interface RHFSearchProps<TFieldValues extends FieldValues>
  extends Omit<SearchFilterProps, 'onSearch'> {
  name: Path<TFieldValues>;
  control?: Control<TFieldValues>;
}

export function RHFSearch<TFieldValues extends FieldValues>(
  props: RHFSearchProps<TFieldValues>,
) {
  const { name, control, ...rest } = props;
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <CustomSearchFilter
          {...rest}
          onSearch={(v) => field.onChange(v)}
        />
      )}
    />
  );
}
