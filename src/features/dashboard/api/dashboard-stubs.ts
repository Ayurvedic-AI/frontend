/** Static design-phase data. Replace with the generated SDK when the backend exists. */
export interface DashboardStat {
  label: string;
  value: string;
  hint: string;
}

export const DASHBOARD_STATS: DashboardStat[] = [
  { label: "Today's consultations", value: '24', hint: '6 awaiting examination' },
  { label: 'Patients', value: '1,312', hint: '+48 this month' },
  { label: 'Ashtavidha Pariksha done', value: '18', hint: '75% of today’s visits' },
  { label: 'Red-flag referrals', value: '2', hint: 'Flagged for allopathic follow-up' },
];
