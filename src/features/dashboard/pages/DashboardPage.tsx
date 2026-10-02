import { DASHBOARD_STATS } from '../api/dashboard-stubs';

export function DashboardPage() {
  return (
    <div className="p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Today's consultations and examinations at a glance.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key figures">
        {DASHBOARD_STATS.map((stat) => (
          <article key={stat.label} className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-3xl font-semibold text-foreground">{stat.value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{stat.hint}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
