import { startTransition, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CustomDrawer } from '../../../common/custom-drawer';
import { cn } from '../../../lib/cn';

interface NavLink {
  label: string;
  path: string;
  icon: ReactNode;
}

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  navLinks: NavLink[];
}

export function MobileDrawer({ open, onClose, navLinks }: MobileDrawerProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNav = (path: string) => {
    startTransition(() => navigate(path));
    onClose();
  };

  return (
    <CustomDrawer
      anchor="left"
      open={open}
      onClose={onClose}
      title=""
      drawerWidth="80vw"
      className="bg-white text-foreground"
    >
      <nav className="-mx-6 pt-2" aria-label="Mobile primary navigation">
        <ul className="flex flex-col">
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <li key={link.path}>
                <button
                  type="button"
                  onClick={() => handleNav(link.path)}
                  className={cn(
                    'flex w-full items-center gap-3 px-6 py-3 text-left text-sm font-medium transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'bg-primary-00 text-primary-07 font-semibold'
                      : 'text-neutral-70 hover:bg-muted hover:text-foreground',
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span aria-hidden className="inline-flex size-5 items-center justify-center">
                    {link.icon}
                  </span>
                  {link.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </CustomDrawer>
  );
}
