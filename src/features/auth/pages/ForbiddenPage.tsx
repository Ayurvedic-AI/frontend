import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CustomButton } from '../../../common/custom-buttons';
import { useAuth } from '../hooks/useAuth';
import { firstPermittedPath } from '../permissions/landing';

/**
 * In-app 403 "No access" page (feature 039, FR-013/FR-014).
 *
 * Rendered in place by the route guard when a user opens a URL they lack the
 * permission for — the protected content never mounts. Offers a link back to a
 * page the user can actually use (or the dashboard fallback).
 */
export function ForbiddenPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const backTo = firstPermittedPath(new Set(user?.permissions ?? [])) ?? '/dashboard';

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-12 text-center">
      <ShieldAlert className="mb-4 size-12 text-muted-foreground sm:size-14" aria-hidden />
      <h1 className="text-xl font-semibold text-foreground sm:text-2xl">No access</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        You don&apos;t have permission to view this page. If you think this is a mistake, contact
        your administrator.
      </p>
      <CustomButton variant="primary" size="md" className="mt-6" onClick={() => navigate(backTo)}>
        Go to a page you can access
      </CustomButton>
    </div>
  );
}

export default ForbiddenPage;
