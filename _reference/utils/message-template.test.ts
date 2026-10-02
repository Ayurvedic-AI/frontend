import { describe, expect, it } from 'vitest';
import { fillTemplate, templatePreview } from './message-template';

describe('fillTemplate', () => {
  it('fills every supported variable', () => {
    const body = 'Namaste {name} ji, this is {agent} from Shree Vishwarang regarding {clinic}, {city}.';
    expect(
      fillTemplate(body, { name: 'Ramesh Deshpande', clinic: 'Deshpande Clinic', city: 'Nashik', agent: 'Priya' }),
    ).toBe('Namaste Ramesh Deshpande ji, this is Priya from Shree Vishwarang regarding Deshpande Clinic, Nashik.');
  });

  it('drops empty variables without leaking braces or double punctuation', () => {
    const body = 'Namaste {name} ji ({clinic}, {city}). Your follow-up is today.';
    expect(fillTemplate(body, { name: 'Ramesh', clinic: null, city: undefined })).toBe(
      'Namaste Ramesh ji. Your follow-up is today.',
    );
  });

  it('leaves unknown placeholders as typed', () => {
    expect(fillTemplate('Hello {name}, order {order_no}', { name: 'A' })).toBe('Hello A, order {order_no}');
  });

  it('fills double-brace {{name}} and spaced { name } (older seed templates)', () => {
    expect(fillTemplate('Namaste {{name}}, from { agent }', { name: 'Meera', agent: 'Priya' })).toBe(
      'Namaste Meera, from Priya',
    );
  });

  it('replaces repeated occurrences of the same variable', () => {
    expect(fillTemplate('{name}, yes {name}!', { name: 'Ram' })).toBe('Ram, yes Ram!');
  });

  it('preserves newlines while collapsing doubled spaces', () => {
    expect(fillTemplate('Hi {name}\n\nRegards,  {agent}', { name: 'A', agent: 'B' })).toBe('Hi A\n\nRegards, B');
  });
});

describe('templatePreview', () => {
  it('flattens newlines and truncates with an ellipsis', () => {
    const long = `Namaste {name}\n${'x'.repeat(100)}`;
    const out = templatePreview(long, { name: 'Ramesh' }, 40);
    expect(out.length).toBe(40);
    expect(out.endsWith('…')).toBe(true);
    expect(out.includes('\n')).toBe(false);
  });
});
