import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { CustomInput } from '../custom-input';
import { CustomSelect, type SelectItem } from '../custom-select';
import { CustomLabel } from '../custom-label';

/**
 * Combined "value + unit" control (feature 061): a decimal input on the left and
 * a unit-of-measure picker on the right, bound to TWO form fields. Composed from
 * the existing custom components (Principle I). Used for Unit (value + UOM) and
 * Processing loss (value + '%'/UOM) in the Raw Material drawer.
 */
export interface RHFAmountUnitProps<TFieldValues extends FieldValues> {
  control?: Control<TFieldValues>;
  /** Field holding the decimal value. */
  valueName: Path<TFieldValues>;
  /** Field holding the unit string. */
  unitName: Path<TFieldValues>;
  label?: React.ReactNode;
  required?: boolean;
  /** Unit-of-measure options for the right-hand dropdown. */
  unitOptions: SelectItem[];
  valuePlaceholder?: string;
  unitPlaceholder?: string;
}

export function RHFAmountUnit<TFieldValues extends FieldValues>({
  control,
  valueName,
  unitName,
  label,
  required,
  unitOptions,
  valuePlaceholder = '0.00',
  unitPlaceholder = 'Unit',
}: RHFAmountUnitProps<TFieldValues>) {
  return (
    <div className="flex w-full flex-col">
      {label && <CustomLabel label={label} htmlFor={valueName} isRequired={required} />}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <Controller
            name={valueName}
            control={control}
            render={({ field, fieldState }) => (
              <CustomInput
                isDecimal
                id={valueName}
                name={field.name}
                placeholder={valuePlaceholder}
                value={(field.value as string | number | undefined) ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                hasError={Boolean(fieldState.error)}
                errorMessage={fieldState.error?.message}
              />
            )}
          />
        </div>
        <div className="w-32 shrink-0">
          <Controller
            name={unitName}
            control={control}
            render={({ field, fieldState }) => (
              <CustomSelect
                name={field.name}
                placeholder={unitPlaceholder}
                items={unitOptions}
                value={(field.value as string | undefined) ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                hasError={Boolean(fieldState.error)}
                errorMessage={fieldState.error?.message}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
