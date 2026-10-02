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
        'inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors md:px-3 md:text-[15px] lg:px-4 lg:text-base',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
        isActive
          ? 'border border-transparent bg-primary-00 font-semibold text-primary-07'
          : 'border border-transparent text-neutral-70 hover:bg-muted hover:text-foreground',
      )}
    >
      <span aria-hidden className="inline-flex size-4 items-center justify-center">
        {icon}
      </span>
      {label}
    </button>
  );
});
