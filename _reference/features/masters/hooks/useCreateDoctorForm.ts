import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { DoctorRow } from '../api/doctors';
import { phoneOptional, stateCodeOptional, zipOptional } from '../../../utils/validation';

const doctorSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  /** Saved into the doctor-aliases master (code is auto-generated server-side). */
  alias: z.string().trim().max(200).optional(),
  clinic_name: z.string().trim().max(200).optional(),
  phone: phoneOptional(),
  address_line1: z.string().trim().max(200).optional(),
  address_line2: z.string().trim().max(200).optional(),
  state_code: stateCodeOptional(),
  city: z.string().trim().max(120).optional(),
  zip_code: zipOptional(),
  is_vip: z.boolean(),
});

export type DoctorFormValues = z.infer<typeof doctorSchema>;
/** @deprecated kept for compatibility with the create-only era. */
export type CreateDoctorFormValues = DoctorFormValues;

const EMPTY: DoctorFormValues = {
  name: '',
  alias: '',
  clinic_name: '',
  phone: '',
  address_line1: '',
  address_line2: '',
  state_code: '',
  city: '',
  zip_code: '',
  is_vip: false,
};

/** Edit mode seeds `alias` separately (it lives in the doctor-aliases master).
 *  Accepts a Partial so create-mode prefills (e.g. from a WON CRM lead) work. */
export function doctorFormDefaults(doctor?: Partial<DoctorRow> | null, alias = ''): DoctorFormValues {
  if (!doctor) return EMPTY;
  return {
    name: doctor.name ?? '',
    alias,
    clinic_name: doctor.clinic_name ?? '',
    phone: doctor.phone ?? '',
    address_line1: doctor.address_line1 ?? '',
    address_line2: doctor.address_line2 ?? '',
    state_code: doctor.state_code ?? '',
    city: doctor.city ?? '',
    zip_code: doctor.zip_code ?? '',
    is_vip: doctor.is_vip ?? false,
  };
}

/** One schema serves create and edit; edit seeds defaults from the row. */
export function useDoctorForm(doctor?: Partial<DoctorRow> | null) {
  return useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: doctorFormDefaults(doctor),
    mode: 'onSubmit',
  });
}

/** @deprecated use `useDoctorForm` (create+edit). */
export const useCreateDoctorForm = useDoctorForm;
