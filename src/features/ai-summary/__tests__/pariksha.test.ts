import { describe, expect, it } from 'vitest';
import { PARIKSHA_SECTIONS, fieldLabel, formatFinding, isAlertField, splitSections } from '../utils/pariksha';

describe('pariksha display helpers', () => {
  it('formats booleans, lists and numbers', () => {
    expect(formatFinding(true)).toBe('Yes');
    expect(formatFinding(['bloating/gas', 'nausea'])).toBe('bloating/gas, nausea');
    expect(formatFinding(0)).toBe('0');
  });

  it('labels fields and only alerts on true referral fields', () => {
    expect(fieldLabel('jaundice_flag')).toBe('Jaundice');
    expect(isAlertField('jaundice_flag', true)).toBe(true);
    expect(isAlertField('jaundice_flag', false)).toBe(false);
    expect(isAlertField('cracks', true)).toBe(false);
  });

  it('keeps schema order, drops notes from rows and lists unrecorded sections', () => {
    const { recorded, missing } = splitSections(
      { jihva: { coating: 'white', notes: 'n' }, nadi: { pulse_rate: 78 }, drik: { notes: 'only notes' } },
      PARIKSHA_SECTIONS,
    );
    expect(recorded.map((s) => s.key)).toEqual(['nadi', 'jihva', 'drik']);
    expect(recorded[1].rows).toEqual([['coating', 'white']]);
    expect(missing).toEqual(['Mutra', 'Mala', 'Shabda', 'Sparsha', 'Akriti']);
  });
});
