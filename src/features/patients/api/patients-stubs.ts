/**
 * Design-phase patient stubs — stand-ins for the Orval-generated `src/sdk/patients`
 * module. An in-memory list backs real list/create/update/delete so the screen
 * behaves end to end with no backend. Hook names and the `{ data, status, headers }`
 * envelope mirror the generated SDK (see features/auth/api/auth-stubs.ts).
 */
import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { ApiError } from '../../../api/client';

// ── Types ───────────────────────────────────────────────────────────────────
export type Gender = 'male' | 'female' | 'other';
export type Language = 'hi' | 'mr' | 'en';
/** Same values the backend's Ashtavidha Pariksha uses for dosha observation, plus "unknown". */
export type Prakriti =
  | 'vata'
  | 'pitta'
  | 'kapha'
  | 'vata-pitta'
  | 'pitta-kapha'
  | 'vata-kapha'
  | 'tridosha'
  | 'unknown';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';
export type PatientStatus = 'active' | 'inactive';

export interface Patient {
  /** Registration number, e.g. "AYU-0001". Assigned on create. */
  id: string;
  full_name: string;
  /** YYYY-MM-DD */
  date_of_birth: string;
  gender: Gender;
  /** 10 national digits. */
  phone: string;
  email: string | null;
  preferred_language: Language;
  address_line: string | null;
  city: string | null;
  state: string | null;
  pin_code: string | null;
  prakriti: Prakriti;
  chief_complaint: string | null;
  allergies: string[];
  conditions: string[];
  medications: string[];
  blood_group: BloodGroup;
  status: PatientStatus;
  /** YYYY-MM-DD, assigned on create. */
  registered_on: string;
  /** YYYY-MM-DD of the latest consultation; null until the first visit. */
  last_visit: string | null;
  notes: string | null;
}

/** Writable fields (server assigns id, registered_on; consultations set last_visit). */
export type PatientInput = Omit<Patient, 'id' | 'registered_on' | 'last_visit'>;

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

// ── Seed data (fictional) ───────────────────────────────────────────────────
const today = dayjs();
const daysAgo = (n: number) => today.subtract(n, 'day').format('YYYY-MM-DD');

const base = {
  email: null,
  address_line: null,
  pin_code: null,
  chief_complaint: null,
  allergies: [],
  conditions: [],
  medications: [],
  blood_group: 'unknown',
  status: 'active',
  notes: null,
} satisfies Partial<Patient>;

const SEED: Patient[] = [
  { ...base, id: 'AYU-0014', full_name: 'Sunita Deshmukh', date_of_birth: '1978-03-12', gender: 'female', phone: '9823456710', preferred_language: 'mr', city: 'Pune', state: 'Maharashtra', address_line: '14, Shaniwar Peth', pin_code: '411030', prakriti: 'vata-pitta', chief_complaint: 'Joint pain in knees, worse in the morning', allergies: ['Sesame oil'], conditions: ['Hypothyroidism'], medications: ['Thyroxine 50 mcg'], blood_group: 'B+', registered_on: daysAgo(210), last_visit: daysAgo(0) },
  { ...base, id: 'AYU-0013', full_name: 'Ramesh Yadav', date_of_birth: '1965-11-02', gender: 'male', phone: '9415023378', preferred_language: 'hi', city: 'Nagpur', state: 'Maharashtra', prakriti: 'kapha', chief_complaint: 'Breathlessness on climbing stairs', allergies: ['Penicillin', 'Sulfa drugs'], conditions: ['Type 2 diabetes', 'Hypertension'], medications: ['Metformin 500 mg', 'Amlodipine 5 mg'], blood_group: 'O+', registered_on: daysAgo(180), last_visit: daysAgo(0) },
  { ...base, id: 'AYU-0012', full_name: 'Ananya Kulkarni', date_of_birth: '1996-07-21', gender: 'female', phone: '9850112233', email: 'ananya.k@example.com', preferred_language: 'en', city: 'Mumbai', state: 'Maharashtra', prakriti: 'pitta', chief_complaint: 'Acidity and burning after meals', blood_group: 'A+', registered_on: daysAgo(95), last_visit: daysAgo(1) },
  { ...base, id: 'AYU-0011', full_name: 'Vikas Patil', date_of_birth: '1988-01-30', gender: 'male', phone: '9762345601', preferred_language: 'mr', city: 'Kolhapur', state: 'Maharashtra', prakriti: 'vata', chief_complaint: 'Lower back stiffness, poor sleep', medications: ['Ashwagandha churna'], registered_on: daysAgo(80), last_visit: daysAgo(3) },
  { ...base, id: 'AYU-0010', full_name: 'Kamla Devi Sharma', date_of_birth: '1952-09-08', gender: 'female', phone: '9935671204', preferred_language: 'hi', city: 'Varanasi', state: 'Uttar Pradesh', prakriti: 'vata-kapha', chief_complaint: 'Swelling in ankles', allergies: ['Aspirin'], conditions: ['Osteoarthritis', 'Cataract (operated)'], medications: ['Calcium + D3'], blood_group: 'AB+', registered_on: daysAgo(400), last_visit: daysAgo(6) },
  { ...base, id: 'AYU-0009', full_name: 'Imran Shaikh', date_of_birth: '1983-05-17', gender: 'male', phone: '9890456712', preferred_language: 'hi', city: 'Aurangabad', state: 'Maharashtra', prakriti: 'pitta-kapha', chief_complaint: 'Recurring skin rash on forearms', allergies: ['Peanuts'], registered_on: daysAgo(60), last_visit: daysAgo(9) },
  { ...base, id: 'AYU-0008', full_name: 'Meera Joshi', date_of_birth: '2001-12-04', gender: 'female', phone: '9970033412', preferred_language: 'mr', city: 'Nashik', state: 'Maharashtra', prakriti: 'unknown', chief_complaint: 'Irregular cycles, fatigue', registered_on: daysAgo(12), last_visit: daysAgo(12) },
  { ...base, id: 'AYU-0007', full_name: 'Harish Agarwal', date_of_birth: '1970-04-25', gender: 'male', phone: '9811230045', email: 'harish.agarwal@example.com', preferred_language: 'en', city: 'Indore', state: 'Madhya Pradesh', prakriti: 'kapha', chief_complaint: 'Weight gain, sluggish digestion', conditions: ['Fatty liver'], blood_group: 'O-', registered_on: daysAgo(300), last_visit: daysAgo(21) },
  { ...base, id: 'AYU-0006', full_name: 'Lata Gaikwad', date_of_birth: '1959-08-19', gender: 'female', phone: '9822001934', preferred_language: 'mr', city: 'Satara', state: 'Maharashtra', prakriti: 'vata', chief_complaint: 'Constipation, dry skin', allergies: ['Ibuprofen'], conditions: ['Hypertension'], medications: ['Telmisartan 40 mg'], blood_group: 'A-', registered_on: daysAgo(520), last_visit: daysAgo(34) },
  { ...base, id: 'AYU-0005', full_name: 'Arjun Mehta', date_of_birth: '1992-02-14', gender: 'male', phone: '9819988776', preferred_language: 'en', city: 'Mumbai', state: 'Maharashtra', prakriti: 'pitta', chief_complaint: 'Migraine with light sensitivity', registered_on: daysAgo(150), last_visit: daysAgo(45) },
  { ...base, id: 'AYU-0004', full_name: 'Savitri Pawar', date_of_birth: '1948-06-01', gender: 'female', phone: '9763320011', preferred_language: 'mr', city: 'Pune', state: 'Maharashtra', prakriti: 'vata-kapha', allergies: ['Shellfish'], conditions: ['Asthma'], medications: ['Salbutamol inhaler'], status: 'inactive', registered_on: daysAgo(700), last_visit: daysAgo(190) },
  { ...base, id: 'AYU-0003', full_name: 'Deepak Chauhan', date_of_birth: '1979-10-10', gender: 'male', phone: '9415577120', preferred_language: 'hi', city: 'Lucknow', state: 'Uttar Pradesh', prakriti: 'tridosha', chief_complaint: 'General weakness after viral fever', registered_on: daysAgo(240), last_visit: daysAgo(70) },
  { ...base, id: 'AYU-0002', full_name: 'Neha Bhosale', date_of_birth: '1990-03-03', gender: 'female', phone: '9881234500', preferred_language: 'mr', city: 'Thane', state: 'Maharashtra', prakriti: 'pitta-kapha', chief_complaint: 'Hair fall, scalp itching', status: 'inactive', registered_on: daysAgo(610), last_visit: daysAgo(260) },
  { ...base, id: 'AYU-0001', full_name: 'Gopal Rao', date_of_birth: '1961-12-22', gender: 'male', phone: '9440012345', preferred_language: 'en', city: 'Hyderabad', state: 'Telangana', prakriti: 'unknown', registered_on: daysAgo(3), last_visit: null },
];

// ponytail: module-level array stands in for the patients table; resets on reload.
let patients: Patient[] = [...SEED];
let nextNumber = 15;

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));

interface Envelope<T> {
  data: T;
  status: number;
  headers: Headers;
}
const ok = <T,>(data: T, status = 200): Envelope<T> => ({ data, status, headers: new Headers() });

// ── GET /patients ───────────────────────────────────────────────────────────
export const getPatientsListQueryKey = () => ['/api/v1/patients'] as const;

export const usePatientsList = () =>
  useQuery({
    queryKey: getPatientsListQueryKey(),
    queryFn: async () => {
      await delay();
      return ok([...patients]);
    },
  });

// ── Mutations ───────────────────────────────────────────────────────────────
type Opts<TData, TVars> = { mutation?: UseMutationOptions<TData, ApiError, TVars> };

export const usePatientsCreate = (options?: Opts<Envelope<Patient>, { data: PatientInput }>) =>
  useMutation<Envelope<Patient>, ApiError, { data: PatientInput }>({
    mutationFn: async ({ data }) => {
      await delay();
      const created: Patient = {
        ...data,
        id: `AYU-${String(nextNumber++).padStart(4, '0')}`,
        registered_on: dayjs().format('YYYY-MM-DD'),
        last_visit: null,
      };
      patients = [created, ...patients];
      return ok(created, 201);
    },
    ...options?.mutation,
  });

export const usePatientsUpdate = (
  options?: Opts<Envelope<Patient>, { patientId: string; data: PatientInput }>,
) =>
  useMutation<Envelope<Patient>, ApiError, { patientId: string; data: PatientInput }>({
    mutationFn: async ({ patientId, data }) => {
      await delay();
      const current = patients.find((p) => p.id === patientId);
      if (!current) throw new ApiError(404, { detail: 'Patient not found' });
      const updated = { ...current, ...data };
      patients = patients.map((p) => (p.id === patientId ? updated : p));
      return ok(updated);
    },
    ...options?.mutation,
  });

export const usePatientsDelete = (options?: Opts<Envelope<null>, { patientId: string }>) =>
  useMutation<Envelope<null>, ApiError, { patientId: string }>({
    mutationFn: async ({ patientId }) => {
      await delay();
      patients = patients.filter((p) => p.id !== patientId);
      return ok(null, 204);
    },
    ...options?.mutation,
  });
