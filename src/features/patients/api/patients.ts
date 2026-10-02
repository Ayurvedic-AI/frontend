/**
 * Patients API: thin layer over the Orval-generated SDK (`src/sdk/patients`).
 * Hook names match what the design-phase stubs exported, so pages did not change.
 * Regenerate the SDK with `bun run sdk:gen`; never edit `src/sdk/*` by hand.
 */
import { usePatientsList as useSdkPatientsList } from '../../../sdk/patients';
import type { PatientIn, PatientOut } from '../../../sdk/schemas';

export {
  getPatientsListQueryKey,
  usePatientsCreate,
  usePatientsDelete,
  usePatientsUpdate,
} from '../../../sdk/patients';

/**
 * A patient as the API returns it. Orval marks defaulted fields optional, but
 * FastAPI serialises every field of the response model, so they are always present.
 */
export type Patient = Required<PatientOut>;
export type PatientInput = PatientIn;

export type Gender = Patient['gender'];
export type Language = Patient['preferred_language'];
export type Prakriti = Patient['prakriti'];
export type BloodGroup = Patient['blood_group'];
export type PatientStatus = Patient['status'];

/** GET /api/v1/patients — newest first; search and filters are client-side. */
export const usePatientsList = () =>
  useSdkPatientsList({
    query: { select: (res) => ({ ...res, data: res.data as Patient[] }) },
  });

// ── Option labels (shared by form, filters and table) ───────────────────────
export const GENDER_LABEL: Record<Gender, string> = { male: 'Male', female: 'Female', other: 'Other' };
export const LANGUAGE_LABEL: Record<Language, string> = { hi: 'Hindi', mr: 'Marathi', en: 'English' };
export const PRAKRITI_LABEL: Record<Prakriti, string> = {
  vata: 'Vata',
  pitta: 'Pitta',
  kapha: 'Kapha',
  'vata-pitta': 'Vata-Pitta',
  'pitta-kapha': 'Pitta-Kapha',
  'vata-kapha': 'Vata-Kapha',
  tridosha: 'Tridosha',
  unknown: 'Not assessed',
};
export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'];
export const STATUS_LABEL: Record<PatientStatus, string> = { active: 'Active', inactive: 'Inactive' };
