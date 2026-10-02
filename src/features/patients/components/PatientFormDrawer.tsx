import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { CustomButton } from '../../../common/custom-buttons';
import { CustomDrawer } from '../../../common/custom-drawer';
import { toast } from '../../../common/common-snackbar';
import {
  RHFDatePicker,
  RHFInput,
  RHFRadioGroup,
  RHFSelect,
  RHFTextarea,
} from '../../../common/rhf-wrappers';
import { INDIAN_STATES } from '../../../utils/indian-states';
import {
  BLOOD_GROUPS,
  GENDER_LABEL,
  LANGUAGE_LABEL,
  PRAKRITI_LABEL,
  STATUS_LABEL,
  getPatientsListQueryKey,
  usePatientsCreate,
  usePatientsUpdate,
  type Patient,
} from '../api/patients-stubs';
import {
  toFormValues,
  toPatientInput,
  usePatientForm,
  type PatientFormValues,
} from '../hooks/usePatientForm';

const items = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));
const GENDER_OPTIONS = items(GENDER_LABEL);
const LANGUAGE_ITEMS = items(LANGUAGE_LABEL);
const PRAKRITI_ITEMS = items(PRAKRITI_LABEL);
const STATUS_OPTIONS = items(STATUS_LABEL);
const BLOOD_ITEMS = BLOOD_GROUPS.map((b) => ({ value: b, label: b === 'unknown' ? 'Not known' : b }));
const STATE_ITEMS = INDIAN_STATES.map((s) => ({ value: s.name, label: s.name }));

interface PatientFormDrawerProps {
  open: boolean;
  /** The patient being edited; null = add a new patient. */
  patient: Patient | null;
  onClose: () => void;
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="border-b border-border pb-6 last:border-b-0">
      <legend className="mb-4 text-sm font-semibold text-foreground">
        {title}
        {hint && <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{hint}</span>}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

const full = 'sm:col-span-2';

export function PatientFormDrawer({ open, patient, onClose }: PatientFormDrawerProps) {
  const queryClient = useQueryClient();
  const { control, handleSubmit, reset } = usePatientForm();
  const isEdit = patient !== null;

  useEffect(() => {
    if (open) reset(toFormValues(patient));
  }, [open, patient, reset]);

  const onSaved = (message: string) => {
    queryClient.invalidateQueries({ queryKey: getPatientsListQueryKey() });
    toast({ message, severity: 'success' });
    onClose();
  };
  const onError = () => toast({ message: 'Could not save the patient. Try again.', severity: 'error' });

  const createMutation = usePatientsCreate({
    mutation: { onSuccess: (res) => onSaved(`${res.data.full_name} added as ${res.data.id}`), onError },
  });
  const updateMutation = usePatientsUpdate({
    mutation: { onSuccess: (res) => onSaved(`${res.data.full_name} updated`), onError },
  });
  const saving = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: PatientFormValues) => {
    const data = toPatientInput(values);
    if (patient) updateMutation.mutate({ patientId: patient.id, data });
    else createMutation.mutate({ data });
  };

  return (
    <CustomDrawer
      anchor="right"
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit ${patient.full_name} · ${patient.id}` : 'Add patient'}
      drawerPadding="0"
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex min-h-full flex-col">
        <div className="flex flex-1 flex-col gap-6 px-5 py-6 md:px-6">
          <Section title="Identity">
            <div className={full}>
              <RHFInput<PatientFormValues> name="full_name" control={control} label="Full name" required placeholder="Enter full name" />
            </div>
            <RHFDatePicker<PatientFormValues>
              name="date_of_birth"
              control={control}
              label="Date of birth"
              required
              placeholder="Select date of birth"
              disableFuture
              minDate={dayjs('1900-01-01')}
            />
            <RHFRadioGroup<PatientFormValues>
              name="gender"
              control={control}
              label="Gender"
              required
              options={GENDER_OPTIONS}
              orientation="horizontal"
            />
            <RHFInput<PatientFormValues> name="phone" control={control} label="Phone" required placeholder="Enter mobile number" phone />
            <RHFInput<PatientFormValues> name="email" control={control} label="Email" placeholder="Enter email" isEmail />
            <RHFSelect<PatientFormValues>
              name="preferred_language"
              control={control}
              label="Preferred language"
              required
              placeholder="Select language"
              items={LANGUAGE_ITEMS}
            />
          </Section>

          <Section title="Ayurvedic profile">
            <RHFSelect<PatientFormValues> name="prakriti" control={control} label="Prakriti" placeholder="Select Prakriti" items={PRAKRITI_ITEMS} />
            <RHFSelect<PatientFormValues> name="blood_group" control={control} label="Blood group" placeholder="Select blood group" items={BLOOD_ITEMS} />
            <div className={full}>
              <RHFTextarea<PatientFormValues>
                name="chief_complaint"
                control={control}
                label="Chief complaint"
                placeholder="Describe the main complaint in the patient's words"
                minRow={2}
              />
            </div>
          </Section>

          <Section title="Safety" hint="Separate items with commas. Allergies show on the patient list.">
            <div className={full}>
              <RHFInput<PatientFormValues> name="allergies" control={control} label="Known allergies" placeholder="Enter allergies, e.g. drugs, foods, oils" />
            </div>
            <RHFInput<PatientFormValues> name="conditions" control={control} label="Existing conditions" placeholder="Enter diagnosed conditions" />
            <RHFInput<PatientFormValues> name="medications" control={control} label="Current medications" placeholder="Enter medicines with dose" />
          </Section>

          <Section title="Address">
            <div className={full}>
              <RHFInput<PatientFormValues> name="address_line" control={control} label="Address" placeholder="Enter house, street, area" />
            </div>
            <RHFInput<PatientFormValues> name="city" control={control} label="City" placeholder="Enter city" />
            <RHFSelect<PatientFormValues> name="state" control={control} label="State" placeholder="Select state" items={STATE_ITEMS} enableDeselect />
            <RHFInput<PatientFormValues> name="pin_code" control={control} label="PIN code" placeholder="Enter 6-digit PIN" numeric maxLength={6} />
          </Section>

          <Section title="Record">
            <RHFRadioGroup<PatientFormValues>
              name="status"
              control={control}
              label="Status"
              options={STATUS_OPTIONS}
              orientation="horizontal"
            />
            <div className={full}>
              <RHFTextarea<PatientFormValues> name="notes" control={control} label="Notes" placeholder="Add notes for your own reference" minRow={3} />
            </div>
          </Section>
        </div>

        <footer className="sticky bottom-0 flex justify-end gap-3 border-t border-border bg-background px-5 py-4 md:px-6">
          <CustomButton type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </CustomButton>
          <CustomButton type="submit" loading={saving}>
            {isEdit ? 'Save changes' : 'Add patient'}
          </CustomButton>
        </footer>
      </form>
    </CustomDrawer>
  );
}
