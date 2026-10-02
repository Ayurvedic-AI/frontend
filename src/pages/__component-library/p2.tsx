import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  CustomAutoComplete,
  CustomAutocompleteMultiselect,
  CustomFileUpload,
  CustomMultiSelect,
  CustomSearchFilter,
  CountryCodeAutocomplete,
  DatePickerField,
  MultipleFilesUpload,
  RHFAutocomplete,
  RHFAutocompleteMultiselect,
  RHFCountryCode,
  RHFDatePicker,
  RHFFileUpload,
  RHFMultipleFileUpload,
  RHFMultiselect,
  RHFSignatureCanvas,
  RHFTimePicker,
  SignatureCanvas,
  TimePickerField,
} from '../../common';

// ── Canonical P2 form ────────────────────────────────────────────────────────

const SKILLS = [
  { key: 'react', value: 'React' },
  { key: 'typescript', value: 'TypeScript' },
  { key: 'tailwind', value: 'Tailwind CSS' },
  { key: 'rhf', value: 'react-hook-form' },
  { key: 'zod', value: 'Zod' },
  { key: 'tanstack-query', value: 'TanStack Query' },
  { key: 'tanstack-table', value: 'TanStack Table' },
  { key: 'radix', value: 'Radix UI' },
];

const COUNTRIES_AC = [
  { key: 'us', value: 'United States' },
  { key: 'in', value: 'India' },
  { key: 'gb', value: 'United Kingdom' },
  { key: 'de', value: 'Germany' },
  { key: 'fr', value: 'France' },
  { key: 'jp', value: 'Japan' },
];

const p2Schema = z.object({
  countryCode: z.string().min(1, 'Required'),
  primaryCountry: z.string().min(1, 'Required'),
  skills: z.array(z.string()).min(1, 'Pick at least one'),
  teammates: z.array(z.string()).min(1, 'Pick at least one'),
  birthDate: z.string().min(1, 'Required'),
  startTime: z.string().min(1, 'Required'),
  resume: z.array(z.object({ id: z.string() }).passthrough()).min(1, 'Upload one file'),
  attachments: z.array(z.object({ name: z.string() }).passthrough()),
  signature: z.string().min(1, 'Please sign'),
});

type P2Form = z.infer<typeof p2Schema>;

function P2FormDemo() {
  const form = useForm<P2Form>({
    resolver: zodResolver(p2Schema),
    mode: 'onBlur',
    defaultValues: {
      countryCode: '+1',
      primaryCountry: '',
      skills: [],
      teammates: [],
      birthDate: '',
      startTime: '',
      resume: [],
      attachments: [],
      signature: '',
    },
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit((data) =>
          alert(
            JSON.stringify(
              {
                ...data,
                resume: data.resume.map((f: unknown) =>
                  typeof f === 'object' && f && 'name' in f ? (f as { name: string }).name : '?',
                ),
                attachments: data.attachments.map((f: unknown) =>
                  typeof f === 'object' && f && 'name' in f ? (f as { name: string }).name : '?',
                ),
                signature: data.signature ? `(data URL, ${data.signature.length} chars)` : '',
              },
              null,
              2,
            ),
          ),
        )}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div className="flex items-end gap-2">
          <RHFCountryCode<P2Form> name="countryCode" />
          <span className="pb-3 text-sm text-muted-foreground">dial code</span>
        </div>
        <RHFAutocomplete<P2Form>
          name="primaryCountry"
          placeholder="Search countries…"
          options={COUNTRIES_AC}
          hasStartSearchIcon
        />
        <RHFMultiselect<P2Form>
          name="skills"
          placeholder="Pick skills"
          options={SKILLS}
          enableSearch
        />
        <RHFAutocompleteMultiselect<P2Form>
          name="teammates"
          placeholder="Tag teammates"
          options={[
            { key: 'alice', value: 'Alice Liddell' },
            { key: 'bob', value: 'Bob Stone' },
            { key: 'carol', value: 'Carol Reyes' },
            { key: 'dan', value: 'Dan Patel' },
            { key: 'eve', value: 'Eve Singh' },
          ]}
          limitTags={3}
        />
        <RHFDatePicker<P2Form>
          name="birthDate"
          label="Birth date"
          maxDate={dayjs()}
        />
        <RHFTimePicker<P2Form> name="startTime" />
        <div className="sm:col-span-2">
          <RHFFileUpload<P2Form> name="resume" type="default" accept=".pdf,.docx" />
        </div>
        <div className="sm:col-span-2">
          <RHFMultipleFileUpload<P2Form> name="attachments" preview="name-list" />
        </div>
        <div className="sm:col-span-2">
          <RHFSignatureCanvas<P2Form> name="signature" height={140} />
        </div>
        <div className="flex justify-end gap-3 sm:col-span-2">
          <button
            type="button"
            onClick={() => form.reset()}
            className="rounded-md px-4 py-2 text-sm hover:bg-secondary"
          >
            Reset
          </button>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Submit
          </button>
        </div>
      </form>
    </FormProvider>
  );
}

// ── Component preview cards (uncontrolled samples) ──────────────────────────

function Preview({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 rounded-lg border border-border bg-background p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

function P2ComponentMatrix() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Preview title="custom-search">
        <CustomSearchFilter textData={{ placeholder: 'Search…', btnTitle: 'Go' }} hasStartSearchIcon />
      </Preview>
      <Preview title="custom-multiselect">
        <CustomMultiSelect
          options={SKILLS}
          value={[]}
          onChange={() => {}}
          placeholder="Pick skills"
          enableSearch
        />
      </Preview>
      <Preview title="custom-auto-complete">
        <CustomAutoComplete
          options={COUNTRIES_AC}
          onChange={() => {}}
          placeholder="Country"
          hasStartSearchIcon
        />
      </Preview>
      <Preview title="custom-autocomplete-multiselect">
        <CustomAutocompleteMultiselect
          options={[
            { key: 'a', value: 'Alice' },
            { key: 'b', value: 'Bob' },
            { key: 'c', value: 'Carol' },
          ]}
          value={[]}
          onChange={() => {}}
          placeholder="Mention…"
          limitTags={2}
        />
      </Preview>
      <Preview title="country-code">
        <CountryCodeAutocomplete value="+1" onChange={() => {}} />
      </Preview>
      <Preview title="date-picker-field">
        <DatePickerField onChange={() => {}} label="Pick a date" />
      </Preview>
      <Preview title="time-picker-field">
        <TimePickerField value="" onChange={() => {}} />
      </Preview>
      <Preview title="custom-fileupload">
        <CustomFileUpload type="drag-drop" size="md" />
      </Preview>
      <Preview title="multiple-files-upload">
        <MultipleFilesUpload onUpload={() => {}} />
      </Preview>
      <Preview title="signature-canvas">
        <SignatureCanvas height={120} />
      </Preview>
    </div>
  );
}

// ── Page composition ─────────────────────────────────────────────────────────

export function P2Demo() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Canonical P2 form</h2>
        <p className="text-sm text-muted-foreground">
          Country code, autocomplete, multi-select, date/time, file uploads, and a signature — all
          bound through one Zod schema.
        </p>
        <P2FormDemo />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">P2 component preview</h2>
        <p className="text-sm text-muted-foreground">
          One card per migrated P2 component, rendered uncontrolled for breakpoint inspection.
        </p>
        <P2ComponentMatrix />
      </section>
    </div>
  );
}

export default P2Demo;
