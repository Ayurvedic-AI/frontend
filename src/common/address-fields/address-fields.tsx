import { useWatch, type Control, type FieldValues, type Path } from 'react-hook-form';
import { CustomLabel } from '../custom-label';
import { RHFInput, RHFAutocomplete } from '../rhf-wrappers';
import { STATE_CODE_OPTIONS, withLegacyOption } from '../../utils/indian-states';

/**
 * Shared structured postal-address block (feature 045): a single, consistently
 * ordered set of fields — Address line 1 → Address line 2 → City → State → Zip code —
 * reused by every address-capturing form (Doctor, Vendor, Dispatch). Defining the
 * order and the State dropdown (feature 043) once keeps the layout identical
 * everywhere (Constitution Principle I/IV; spec FR-007).
 *
 * The form's field names MUST be: `address_line1`, `address_line2`, `city`,
 * `state_code`, `zip_code` (matching the backend). All fields are optional.
 */
export interface AddressFieldsProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
}

export function AddressFields<TFieldValues extends FieldValues>({
  control,
}: AddressFieldsProps<TFieldValues>) {
  const currentState = useWatch({ control, name: 'state_code' as Path<TFieldValues> }) as
    | string
    | null
    | undefined;
  const stateOptions = withLegacyOption(STATE_CODE_OPTIONS, currentState ?? undefined);

  return (
    <div className="flex flex-col gap-3">
      <RHFInput<TFieldValues>
        name={'address_line1' as Path<TFieldValues>}
        control={control}
        label="Address line 1"
        placeholder="Street, building, area"
      />
      <RHFInput<TFieldValues>
        name={'address_line2' as Path<TFieldValues>}
        control={control}
        label="Address line 2"
        placeholder="Landmark, locality (optional)"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <RHFInput<TFieldValues>
          name={'city' as Path<TFieldValues>}
          control={control}
          label="City"
          placeholder="Enter city"
        />
        <div className="flex flex-col gap-1">
          <CustomLabel label="State" htmlFor="state_code" />
          <RHFAutocomplete<TFieldValues>
            name={'state_code' as Path<TFieldValues>}
            control={control}
            placeholder="Select state"
            options={stateOptions}
            hasStartSearchIcon
            commitFreeText
          />
        </div>
        <RHFInput<TFieldValues>
          name={'zip_code' as Path<TFieldValues>}
          control={control}
          label="Zip code"
          placeholder="6-digit PIN"
        />
      </div>
    </div>
  );
}

export default AddressFields;
