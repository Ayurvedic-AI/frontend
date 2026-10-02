import { Loader2 } from 'lucide-react';
import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopHeader, MobileDrawer } from '../features/navbar';
import { useVisibleNavLinks } from '../features/navbar/use-visible-nav';

/**
 * Protected app shell. A sticky `<TopHeader />` carries the brand and the nav
 * links over the scrollable content; on mobile the links move into the
 * `<MobileDrawer />` opened from the header.
 */
export default function ProtectedLayout() {
  const navLinks = useVisibleNavLinks();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <TopHeader navLinks={navLinks} onOpenNav={() => setDrawerOpen(true)} />

      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <Loader2 className="size-9 animate-spin text-primary" aria-hidden />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} navLinks={navLinks} />
    </div>
  );
}
