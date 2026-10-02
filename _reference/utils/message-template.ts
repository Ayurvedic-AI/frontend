/** Variable filling for WhatsApp message templates.
 *
 * Templates may contain `{name}`, `{clinic}`, `{city}` and `{agent}` — filled
 * from whoever is being messaged + the logged-in user. A variable with no
 * value disappears cleanly (no `{clinic}` leaking to a client), and the
 * surrounding whitespace/punctuation is tidied so the sentence still reads.
 */

export interface TemplateFillValues {
  name?: string | null;
  clinic?: string | null;
  city?: string | null;
  agent?: string | null;
}

export const TEMPLATE_VARIABLES = ['name', 'clinic', 'city', 'agent'] as const;

export function fillTemplate(body: string, values: TemplateFillValues): string {
  let out = body;
  for (const key of TEMPLATE_VARIABLES) {
    const value = values[key]?.trim() ?? '';
    // Tolerate {name}, {{name}} (Handlebars-style, from older seed templates)
    // and inner spacing like { name }. Unknown variables are left as typed.
    const re = new RegExp(`\\{\\{?\\s*${key}\\s*\\}\\}?`, 'g');
    out = out.replace(re, value);
  }
  return out
    .replace(/\(\s*,?\s*\)/g, '') // "( )" left by empty vars inside brackets
    .replace(/\s+([,.!?])/g, '$1') // space squeezed before punctuation
    .replace(/,\s*,/g, ',') // ", ," from an empty middle value
    .replace(/[ \t]{2,}/g, ' ') // collapse doubled spaces (keep newlines)
    .replace(/^[ \t]+|[ \t]+$/gm, '');
}

/** A short single-line preview of the filled template (for the picker rows). */
export function templatePreview(body: string, values: TemplateFillValues, max = 80): string {
  const filled = fillTemplate(body, values).replace(/\s*\n+\s*/g, ' ');
  return filled.length > max ? `${filled.slice(0, max - 1)}…` : filled;
}
