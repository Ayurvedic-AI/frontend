import { BookOpen, Mic, Stethoscope, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { BrandLogo } from '../../../common/brand-logo';

interface AuthLayoutProps {
  /** Optional photo for the left pane; omitted → branded gradient panel. */
  imageSrc?: string;
  imageAlt?: string;
  children: ReactNode;
}

const HIGHLIGHTS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Mic, title: 'Voice consultations', text: 'Record in Hindi, Marathi or English — transcribed and translated.' },
  { icon: Stethoscope, title: 'Ashtavidha Pariksha', text: 'Guided eight-fold examination with red-flag screening.' },
  { icon: BookOpen, title: 'Classical references', text: 'Relevant Charaka Samhita verses for every case.' },
];

/**
 * Split-screen auth shell:
 *   - Left half (md+ only): brand panel (or a full-bleed image when `imageSrc` is given).
 *   - Right half: logo at top-left, form vertically centered, max-width 520px.
 * Mobile (< md): left pane hidden, form takes the full viewport width.
 */
export function AuthLayout({ imageSrc, imageAlt = '', children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen" data-slot="auth-layout">
      <aside data-slot="brand-pane" className="relative hidden overflow-hidden md:block md:w-1/2">
        {imageSrc ? (
          <img src={imageSrc} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col justify-between bg-shell p-10 text-white lg:p-14">
            <BrandLogo size="md" inverted />
            <div className="max-w-md">
              <h2 className="text-3xl font-semibold leading-tight lg:text-4xl">
                Ayurvedic consultations, assisted by AI.
              </h2>
              <ul className="mt-8 space-y-5">
                {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex gap-4">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <span>
                      <span className="block font-medium">{title}</span>
                      <span className="block text-sm text-white/75">{text}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-white/60">© {new Date().getFullYear()} Ayurveda AI</p>
          </div>
        )}
      </aside>
      <section
        data-slot="form-pane"
        className="flex w-full flex-col bg-page px-6 py-8 sm:px-8 md:w-1/2 lg:px-16"
      >
        <BrandLogo size="md" className="mb-4 self-start" />
        <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center">
          {children}
        </div>
      </section>
    </div>
  );
}

export default AuthLayout;
