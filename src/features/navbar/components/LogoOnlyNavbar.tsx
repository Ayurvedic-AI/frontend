import { BrandLogo } from '../../../common/brand-logo';
import { NAVBAR_HEIGHT } from '../constants';

export function LogoOnlyNavbar() {
  return (
    <header
      className="fixed inset-x-0 top-0 z-40 flex items-center border-b border-border bg-white px-2 md:px-4"
      style={{ height: NAVBAR_HEIGHT }}
      data-slot="logo-only-navbar"
    >
      <BrandLogo size="sm" />
    </header>
  );
}
