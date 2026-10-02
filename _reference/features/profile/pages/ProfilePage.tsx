import { useState } from 'react';
import { KeyRound, Loader2, Pencil } from 'lucide-react';
import { CustomButton } from '../../../common/custom-buttons';
import { useAuth } from '../../auth/hooks/useAuth';
import { ProfileDetails } from '../components/ProfileDetails';
import { EditProfileDrawer } from '../components/EditProfileDrawer';
import { ChangePasswordDrawer } from '../components/ChangePasswordDrawer';

/** Signed-in user's self-service profile: view own details, edit them, or
 *  change password. Reads the current user from the cached /auth/me. */
export function ProfilePage() {
  const { user, isLoading, refetchMe } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-9 animate-spin text-primary" aria-hidden />
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-foreground">My Profile</h1>
        <div className="flex flex-wrap gap-3">
          <CustomButton type="button" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil aria-hidden className="size-4" />
            Edit Profile
          </CustomButton>
          <CustomButton type="button" variant="primary" onClick={() => setPasswordOpen(true)}>
            <KeyRound aria-hidden className="size-4" />
            Change Password
          </CustomButton>
        </div>
      </div>

      <ProfileDetails user={user} />

      <EditProfileDrawer
        user={user}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onUpdated={() => void refetchMe()}
      />
      <ChangePasswordDrawer open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}
