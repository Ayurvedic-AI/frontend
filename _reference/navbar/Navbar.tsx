import {
  Boxes,
  Home,
  Menu,
  PackageSearch,
  ScrollText,
  ShieldCheck,
  UserCog,
} from 'lucide-react';
import { useState } from 'react';
import logoDark from '../../../assets/logo-dark-font.png';
import { NAVBAR_HEIGHT } from '../constants';
import { GlobalSearch } from './GlobalSearch';
import { MobileDrawer } from './MobileDrawer';
import { NavItem } from './NavItem';
import { UserMenu } from './UserMenu';

const NAV_LINKS = [
  { label: 'Dashboard', path: '/dashboard', icon: <Home className="size-4" /> },
  // { label: 'All Clients', path: '/clients', icon: <Users className="size-4" /> },
  { label: 'Users', path: '/users', icon: <UserCog className="size-4" /> },
  { label: 'Masters', path: '/masters', icon: <Boxes className="size-4" /> },
  { label: 'Inventory', path: '/inventory', icon: <PackageSearch className="size-4" /> },
  { label: 'Roles & Permissions', path: '/roles-permissions', icon: <ShieldCheck className="size-4" /> },
  { label: 'Activity Log', path: '/activity-log', icon: <ScrollText className="size-4" /> },
  // { label: 'Assessments', path: '/assessments', icon: <ClipboardCheck className="size-4" /> },
  // { label: 'Settings', path: '/settings', icon: <Settings className="size-4" /> },
];

export function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-40 flex items-center gap-4 border-b border-border bg-white px-2 md:px-4"
        style={{ height: NAVBAR_HEIGHT }}
        data-slot="navbar"
      >
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          className="inline-flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
        >
          <Menu aria-hidden className="size-5" />
        </button>

        {/* Logo */}
        <img
          src={logoDark}
          alt="Test"
          className="h-8 w-auto shrink-0"
        />

        {/* Desktop nav links — centered */}
        <nav
          aria-label="Primary"
          className="hidden flex-1 items-center justify-center gap-2 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <NavItem key={link.path} label={link.label} path={link.path} icon={link.icon} />
          ))}
        </nav>

        {/* Mobile spacer to push the right cluster */}
        <div className="flex-1 md:hidden" />

        {/* Right cluster: search + user menu */}
        <div className="flex shrink-0 items-center gap-2 md:gap-3 lg:gap-4">
          <GlobalSearch />
          <UserMenu />
        </div>
      </header>

      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        navLinks={NAV_LINKS}
      />
    </>
  );
}
