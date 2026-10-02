/**
 * Display helpers for examination findings. Section labels and Agni descriptions copy
 * backend/app/pariksha.py (served by GET /pariksha/schema); swap for that endpoint when wiring the SDK.
 */
import type { FindingValue, Findings } from '../api/ai-summary-stubs';

export const PARIKSHA_SECTIONS: [key: string, label: string][] = [
  ['nadi', 'Nadi · pulse'],
  ['mutra', 'Mutra · urine'],
  ['mala', 'Mala · stool'],
  ['jihva', 'Jihva · tongue'],
  ['shabda', 'Shabda · voice'],
  ['sparsha', 'Sparsha · touch'],
  ['drik', 'Drik · eyes'],
  ['akriti', 'Akriti · build'],
];

export const ASSESSMENT_SECTIONS: [key: string, label: string][] = [
  ['agni', 'Agni · appetite & digestion'],
  ['mala_assessment', 'Mala · bowel habit'],
];

export const AGNI_DESCRIPTION: Record<string, string> = {
  samagni: 'appetite and digestion generally comfortable / regular',
  mandagni: 'low appetite, heaviness, slow digestion',
  tikshnagni: 'very strong appetite, burning / acidity, intolerance of delayed meals',
  vishamagni: 'irregular appetite / digestion, gas, bloating, variable bowel habits',
};

/** Fields the backend treats as referral flags or red-flag triggers when true. */
const ALERT_FIELDS = new Set([
  'jaundice_flag',
  'pallor_flag',
  'blood',
  'breathless_while_speaking',
]);

export const fieldLabel = (field: string) => {
  const s = field.replace(/_flag$/, '').replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function formatFinding(value: FindingValue): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

export const isAlertField = (field: string, value: FindingValue) => value === true && ALERT_FIELDS.has(field);

/** Split the schema's sections into recorded ones (with their rows) and the labels of the rest. */
export function splitSections(findings: Findings, sections: [string, string][]) {
  const recorded: { key: string; label: string; rows: [string, FindingValue][]; notes?: string }[] = [];
  const missing: string[] = [];
  for (const [key, label] of sections) {
    const fields = findings[key];
    const rows = Object.entries(fields ?? {}).filter(([f, v]) => f !== 'notes' && f !== 'photo_url' && v !== '');
    if (rows.length === 0 && !fields?.notes) {
      missing.push(label.split(' · ')[0]);
      continue;
    }
    recorded.push({ key, label, rows, notes: fields?.notes as string | undefined });
  }
  return { recorded, missing };
}
