/** WhatsApp click-to-chat helpers (no Meta API — a separate WhatsApp product is
 * planned). Builds a wa.me deep link and copies a message template so the user
 * can paste it into the chat. */

/** Normalize an (Indian) phone to the digits wa.me expects (10-digit → +91). */
export function toWaNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  // A 10-digit national number must be a real mobile (6-9 start) — anything else
  // (e.g. 24323 23432) isn't WhatsApp-able, so no icon/link is offered for it.
  if (digits.length === 10) return /^[6-9]/.test(digits) ? `91${digits}` : null;
  if (digits.length === 11 && digits.startsWith('0'))
    return /^[6-9]/.test(digits.slice(1)) ? `91${digits.slice(1)}` : null;
  return digits; // already carries a country code
}

/** wa.me deep link for a number, optionally pre-filling a message. */
export function waLink(phone: string | null | undefined, message?: string): string | null {
  const num = toWaNumber(phone);
  if (!num) return null;
  const base = `https://wa.me/${num}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
