import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import { emailOptional, phoneRequired, zipOptional } from '../../../utils/validation';
import type { Patient, PatientInput } from '../api/patients';

// Selects hold plain strings; the enum check happens here so the error shows on the field.
const oneOf = (values: readonly string[], message: string) =>
  z.string().refine((v) => values.includes(v), message);

const patientSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required').max(120),
  date_of_birth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((v) => !dayjs(v).isAfter(dayjs(), 'day'), 'Date of birth cannot be in the future'),
  gender: oneOf(['male', 'female', 'other'], 'Select gender'),
  phone: phoneRequired(),
  email: emailOptional(),
  preferred_language: oneOf(['hi', 'mr', 'en'], 'Select preferred language'),
  address_line: z.string().max(200),
  city: z.string().max(80),
  state: z.string(),
  pin_code: zipOptional(),
  prakriti: z.string(),
  chief_complaint: z.string().max(300),
  // Comma-separated in the form, string[] on the record.
  allergies: z.string().max(300),
  conditions: z.string().max(300),
  medications: z.string().max(300),
  blood_group: z.string(),
  status: oneOf(['active', 'inactive'], 'Select status'),
  notes: z.string().max(1000),
});

export type PatientFormValues = z.infer<typeof patientSchema>;

const EMPTY: PatientFormValues = {
  full_name: '',
  date_of_birth: '',
  gender: '',
  phone: '',
  email: '',
  preferred_language: '',
  address_line: '',
  city: '',
  state: '',
  pin_code: '',
  prakriti: 'unknown',
  chief_complaint: '',
  allergies: '',
  conditions: '',
  medications: '',
  blood_group: 'unknown',
  status: 'active',
  notes: '',
};

export function toFormValues(patient: Patient | null): PatientFormValues {
  if (!patient) return EMPTY;
  return {
    full_name: patient.full_name,
    date_of_birth: patient.date_of_birth,
    gender: patient.gender,
    phone: patient.phone,
    email: patient.email ?? '',
    preferred_language: patient.preferred_language,
    address_line: patient.address_line ?? '',
    city: patient.city ?? '',
    state: patient.state ?? '',
    pin_code: patient.pin_code ?? '',
    prakriti: patient.prakriti,
    chief_complaint: patient.chief_complaint ?? '',
    allergies: patient.allergies.join(', '),
    conditions: patient.conditions.join(', '),
    medications: patient.medications.join(', '),
    blood_group: patient.blood_group,
    status: patient.status,
    notes: patient.notes ?? '',
  };
}

const list = (v: string) =>
  v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
const orNull = (v: string | undefined) => v?.trim() || null;

/** Validated form values → API payload. Enum fields are already checked by the schema. */
export function toPatientInput(v: PatientFormValues): PatientInput {
  return {
    full_name: v.full_name.trim(),
    date_of_birth: v.date_of_birth,
    gender: v.gender as PatientInput['gender'],
    phone: v.phone,
    email: orNull(v.email),
    preferred_language: v.preferred_language as PatientInput['preferred_language'],
    address_line: orNull(v.address_line),
    city: orNull(v.city),
    state: orNull(v.state),
    pin_code: orNull(v.pin_code),
    prakriti: (v.prakriti || 'unknown') as PatientInput['prakriti'],
    chief_complaint: orNull(v.chief_complaint),
    allergies: list(v.allergies),
    conditions: list(v.conditions),
    medications: list(v.medications),
    blood_group: (v.blood_group || 'unknown') as PatientInput['blood_group'],
    status: v.status as PatientInput['status'],
    notes: orNull(v.notes),
  };
}

export function usePatientForm() {
  return useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: EMPTY,
    mode: 'onSubmit',
  });
}
