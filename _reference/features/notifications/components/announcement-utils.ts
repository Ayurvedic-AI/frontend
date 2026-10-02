/** Minimal audience shape shared by AnnouncementOut and AnnouncementScheduleOut. */
interface AudienceLike {
  audience_type: 'USER' | 'ROLE' | 'ALL';
  audience_role?: string | null;
}

/** Human-readable audience (shared by the announcements + schedules tables/drawers). */
export function audienceLabel(a: AudienceLike): string {
  if (a.audience_type === 'ALL') return 'All users';
  if (a.audience_type === 'ROLE') return `Role — ${a.audience_role}`;
  return 'User';
}
