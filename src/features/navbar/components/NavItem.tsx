import { startTransition, memo, useCallback, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../../lib/cn';
import { routePreloadMap } from '../../../utils/routePreloadMap';
import { isNavPathActive } from '../nav-links';

interface NavItemProps {
  label: string;
  path: string;
  icon: ReactNode;
}

export const NavItem = memo(function NavItem({ label, path, icon }: NavItemProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = isNavPathActive(location.pathname, path);

  const handlePreload = useCallback(() => {
    routePreloadMap[path]?.preload();
  }, [path]);

  return (
    <button
      type="button"
      onMouseEnter={handlePreload}
      onFocus={handlePreload}
      onClick={(e) => {
        (e.currentTarget as HTMLElement).blur();
        startTransition(() => navigate(path));
      }}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        // Sits on the shell band: light text, and a copper bar along the band's bottom edge marks the current page.
        'relative inline-flex h-16 items-center gap-2 whitespace-nowrap px-3 text-base transition-colors lg:px-4',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-shell-foreground',
        isActive ? 'font-semibold text-white' : 'font-medium text-shell-foreground/85 hover:bg-white/10 hover:text-white',
      )}
    >
      <span aria-hidden className="inline-flex size-[18px] items-center justify-center">
        {icon}
      </span>
      {label}
      {isActive && <span aria-hidden className="absolute inset-x-3 bottom-0 h-[3px] rounded-t-sm bg-accent-30 lg:inset-x-4" />}
    </button>
  );
});
