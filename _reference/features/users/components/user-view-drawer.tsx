/**
 * Read-only User view drawer: identity hero + the create/edit form's fields.
 * Opened from the table's View action / row click. Edit only shows when the
 * viewer holds users.update (mirrors the kebab).
 */
import type { ReactNode } from 'react';
import { Mail, Phone, UserRound } from 'lucide-react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { usePermissions } from '../../auth/permissions';
import { fullName, formatDateTime } from '../../../utils/format';
import { formatIndianPhone } from '../../../utils/phone';
import type { UserRow } from '../api/users';
import { RoleBadge } from './RoleBadge';
import { UserStatusPill } from './UserStatusPill';

export interface UserViewDrawerProps {
  open: boolean;
  user: UserRow | null;
  onClose: () => void;
  onEdit: (user: UserRow) => void;
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value ?? '—'}</dd>
    </div>
  );
}

export function UserViewDrawer({ open, user, onClose, onEdit }: UserViewDrawerProps) {
  const { canUpdate } = usePermissions();
  const canEdit = canUpdate('users');
  return (
    <CustomDrawer
      anchor="right"
      title="User"
      open={open}
      onClose={onClose}
      drawerWidth="42rem"
      drawerPadding="0px"
    >
      {user && (
        <div className="flex min-h-full flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
            {/* Identity hero */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserRound className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">
                    {fullName(user.first_name, user.last_name) || user.email}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <RoleBadge role={user.role} />
                <UserStatusPill isActive={user.is_active} passwordSet={user.password_set} />
              </div>
            </div>

            {/* Mirrors the create/edit form fields exactly. */}
            <SectionCard title="Details">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Field label="First name" value={user.first_name || '—'} />
                <Field label="Last name" value={user.last_name || '—'} />
                <Field
                  label="Email"
                  value={
                    <span className="flex items-center gap-1.5 break-all">
                      <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                      {user.email}
                    </span>
                  }
                />
                <Field
                  label="Phone"
                  value={
                    user.phone ? (
                      <span className="flex items-center gap-1.5">
                        <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                        {formatIndianPhone(user.phone)}
                      </span>
                    ) : (
                      '—'
                    )
                  }
                />
                <Field label="Role" value={<RoleBadge role={user.role} />} />
              </dl>
            </SectionCard>

            <SectionCard title="Account">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Field label="Status" value={<UserStatusPill isActive={user.is_active} passwordSet={user.password_set} />} />
                <Field
                  label="Last login"
                  value={user.last_login_at ? formatDateTime(user.last_login_at) : 'Never'}
                />
              </dl>
            </SectionCard>
          </div>
          <div className="shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
            <CustomButton type="button" variant="outline" onClick={onClose}>
              Close
            </CustomButton>
            {canEdit && (
              <CustomButton type="button" variant="primary" onClick={() => onEdit(user)}>
                Edit
              </CustomButton>
            )}
          </div>
        </div>
      )}
    </CustomDrawer>
  );
}
