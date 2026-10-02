import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CustomButton } from '../../../common/custom-buttons';
import { useAuthLogout } from '../api/auth-stubs';
import { useAuth } from '../hooks/useAuth';

/**
 * Dedicated full-page "No access" screen (feature 039, FR-016a).
 *
 * Shown when a signed-in user has an empty effective permission set (an active
 * role with zero view grants) — they can view no section at all. Distinct in copy
 * from the route-level 403 (ForbiddenPage), and keeps the sign-out action so the
 * user isn't trapped. Rendered standalone (no app shell), since there is no nav.
 */
export function NoAccessPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const logout = useAuthLogout();

  const handleSignOut = () => {
    logout.mutate(undefined, {
      onSettled: () => {
        signOut();
        navigate('/login', { replace: true });
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center">
      <Lock className="mb-4 size-12 text-muted-foreground sm:size-14" aria-hidden />
      <h1 className="text-xl font-semibold text-foreground sm:text-2xl">No access yet</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Your account doesn&apos;t have access to any sections yet. Please contact your administrator
        to have the right permissions assigned.
      </p>
      <CustomButton
        variant="outline"
        size="md"
        className="mt-6"
        loading={logout.isPending}
        onClick={handleSignOut}
      >
        Sign out
      </CustomButton>
    </div>
  );
}

export default NoAccessPage;
