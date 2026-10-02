/** Doctor commercial-tier (Category) display helpers. The tier itself is
 * auto-derived on the backend from lifetime paid order value; here we only map
 * it to a tone for the badge. Reusable per CODE-STANDARDS #1 (no inline maps). */
export type DoctorCategory = 'Bronze' | 'Silver' | 'Gold' | 'Diamond';

const DOCTOR_CATEGORY_TONE: Record<DoctorCategory, string> = {
  Bronze: 'bg-muted text-muted-foreground',
  Silver: 'bg-info/10 text-info',
  Gold: 'bg-warning/10 text-warning',
  Diamond: 'bg-positive/10 text-positive',
};

export function doctorCategoryTone(category: string): string {
  return DOCTOR_CATEGORY_TONE[category as DoctorCategory] ?? DOCTOR_CATEGORY_TONE.Bronze;
}
