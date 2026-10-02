import { P1Demo } from './p1';
import { P2Demo } from './p2';
import { P3Demo } from './p3';
import { P4Demo } from './p4';
import { PageHeader } from '../../common/page-header';
import { CustomButton } from '../../common/custom-buttons';

/**
 * Dev-only component library page. Gated behind `import.meta.env.DEV` in
 * `src/App.tsx`. Sections are added phase-by-phase as the MUI → Tailwind
 * migration lands (US1 → US4).
 *
 * Verification artifact for spec SC-003: every migrated component renders
 * correctly at the five Tailwind breakpoints `sm`/`md`/`lg`/`xl`/`2xl`.
 */
export default function ComponentLibraryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Ayurveda AI / dev-only</p>
          <h1 className="text-2xl font-semibold sm:text-3xl">Component library — P1, P2, P3 &amp; P4</h1>
          <p className="text-sm text-muted-foreground">
            Tailwind + Radix + react-hook-form + Zod. Resize the viewport to verify breakpoint behavior.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-16 px-4 py-8 sm:px-6 lg:px-8">
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Page header</h2>
          <div className="rounded-lg border border-border bg-page p-6">
            <PageHeader
              title="Patients"
              description="14 registered · 6 with known allergies"
              actions={<CustomButton>Add patient</CustomButton>}
              className="mb-0"
            />
          </div>
        </section>
        <P1Demo />
        <div className="border-t border-border pt-12">
          <P2Demo />
        </div>
        <div className="border-t border-border pt-12">
          <P3Demo />
        </div>
        <div className="border-t border-border pt-12">
          <P4Demo />
        </div>
      </main>
      <footer className="border-t border-border px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
        <a
          href="#"
          className="text-primary hover:underline"
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = '';
          }}
        >
          ← Back to app
        </a>
      </footer>
    </div>
  );
}
