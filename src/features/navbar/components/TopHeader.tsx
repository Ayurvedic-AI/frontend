import { Menu } from 'lucide-react';
import { BrandLogo } from '../../../common/brand-logo';
import type { NavLink } from '../nav-links';
import { NavItem } from './NavItem';
import { UserMenu } from './UserMenu';

interface TopHeaderProps {
  navLinks: NavLink[];
  onOpenNav: () => void;
}

/** App bar: brand + primary nav links (md+) + user menu. Below md the links move to the MobileDrawer. */
export function TopHeader({ navLinks, onOpenNav }: TopHeaderProps) {
  return (
    <header
      className="sticky top-0 z-20 flex h-16 items-center gap-3 bg-shell px-4 text-shell-foreground md:gap-8 md:px-6"
      data-slot="top-header"
    >
      {/* Mobile menu trigger */}
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation menu"
        className="inline-flex size-10 items-center justify-center rounded-md text-shell-foreground hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shell-foreground md:hidden"
      >
        <Menu aria-hidden className="size-5" />
      </button>

      <BrandLogo size="sm" inverted className="shrink-0" />

      <nav aria-label="Primary" className="hidden min-w-0 flex-1 overflow-x-auto md:block">
        <ul className="flex items-center">
          {navLinks.map((link) => (
            <li key={link.path}>
              <NavItem label={link.label} path={link.path} icon={link.icon} />
            </li>
          ))}
        </ul>
      </nav>

      <div className="ml-auto shrink-0">
        <UserMenu />
      </div>
    </header>
  );
}
