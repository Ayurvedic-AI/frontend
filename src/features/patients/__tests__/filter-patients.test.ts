import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import type { Patient } from '../api/patients-stubs';
import { ageInYears, filterPatients } from '../utils/filter-patients';

const p = (over: Partial<Patient>): Patient =>
  ({ id: 'AYU-0001', full_name: 'Sunita Deshmukh', phone: '9823456710', status: 'active', prakriti: 'vata', ...over }) as Patient;

const LIST = [
  p({}),
  p({ id: 'AYU-0002', full_name: 'Ramesh Yadav', phone: '9415023378', status: 'inactive', prakriti: 'kapha' }),
];
const all = { query: '', status: 'all', prakriti: 'all' } as const;

describe('filterPatients', () => {
  it('matches name, Reg. No. and formatted phone', () => {
    expect(filterPatients(LIST, { ...all, query: 'ramesh' }).map((x) => x.id)).toEqual(['AYU-0002']);
    expect(filterPatients(LIST, { ...all, query: 'ayu-0001' }).map((x) => x.id)).toEqual(['AYU-0001']);
    expect(filterPatients(LIST, { ...all, query: '+91 94150' }).map((x) => x.id)).toEqual(['AYU-0002']);
  });

  it('does not phone-match on one or two stray digits', () => {
    expect(filterPatients(LIST, { ...all, query: '9' })).toEqual([]);
  });

  it('combines status and Prakriti filters', () => {
    expect(filterPatients(LIST, { ...all, status: 'inactive' }).map((x) => x.id)).toEqual(['AYU-0002']);
    expect(filterPatients(LIST, { ...all, status: 'active', prakriti: 'kapha' })).toEqual([]);
  });
});

describe('ageInYears', () => {
  it('counts whole years, not rounding up before the birthday', () => {
    expect(ageInYears('1990-06-15', dayjs('2026-06-14'))).toBe(35);
    expect(ageInYears('1990-06-15', dayjs('2026-06-15'))).toBe(36);
  });
});
