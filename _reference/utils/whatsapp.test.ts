import { describe, expect, it } from 'vitest';
import { toWaNumber, waLink } from './whatsapp';

describe('toWaNumber', () => {
  it('prefixes +91 for a 10-digit Indian number', () => {
    expect(toWaNumber('9822011111')).toBe('919822011111');
  });
  it('strips spaces/dashes', () => {
    expect(toWaNumber('98220 11111')).toBe('919822011111');
    expect(toWaNumber('+91 98220-11111')).toBe('919822011111');
  });
  it('drops a leading 0 on an 11-digit number', () => {
    expect(toWaNumber('09822011111')).toBe('919822011111');
  });
  it('returns null for empty / masked input', () => {
    expect(toWaNumber('')).toBeNull();
    expect(toWaNumber('**********')).toBeNull();
    expect(toWaNumber(null)).toBeNull();
  });
  it('refuses a 10-digit number that is not a real mobile (starts < 6)', () => {
    expect(toWaNumber('2432323432')).toBeNull();
    expect(toWaNumber('02432323432')).toBeNull();
  });
});

describe('waLink', () => {
  it('builds a wa.me link', () => {
    expect(waLink('9822011111')).toBe('https://wa.me/919822011111');
  });
  it('pre-fills an encoded message', () => {
    expect(waLink('9822011111', 'Namaste Dr. A')).toBe('https://wa.me/919822011111?text=Namaste%20Dr.%20A');
  });
  it('returns null when there is no usable number', () => {
    expect(waLink('**********', 'hi')).toBeNull();
  });
});
