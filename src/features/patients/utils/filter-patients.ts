import dayjs from 'dayjs';
import { normalizeIndianPhone } from '../../../utils/phone';
import type { Patient, PatientStatus, Prakriti } from '../api/patients';

export interface PatientFilters {
  query: string;
  status: PatientStatus | 'all';
  prakriti: Prakriti | 'all';
}

/** Search matches name, Reg. No. or phone digits (case- and spacing-insensitive). */
export function filterPatients(patients: Patient[], { query, status, prakriti }: PatientFilters): Patient[] {
  const q = query.trim().toLowerCase();
  const digits = normalizeIndianPhone(q);
  return patients.filter(
    (p) =>
      (status === 'all' || p.status === status) &&
      (prakriti === 'all' || p.prakriti === prakriti) &&
      (!q ||
        p.full_name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (digits.length >= 3 && p.phone.includes(digits))),
  );
}

/** Whole years since `dob` as of `on` (defaults to today). */
export function ageInYears(dob: string, on = dayjs()): number {
  return on.diff(dayjs(dob), 'year');
}
