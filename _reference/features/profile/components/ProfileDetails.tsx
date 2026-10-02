import { memo } from 'react';
import { cn } from '../../../lib/cn';
import { UserAvatar } from '../../../common/user-avatar';
import type { MeResponse } from '../../../sdk/schemas';
import { formatIndianPhone } from '../../../utils/phone';

export interface ProfileDetailsProps {
  user: MeResponse;
}

/** Read-only presentation of the signed-in user's own account information.
 *  Absent name/phone render as "Not set" (never a blank row). The display name
 *  falls back to the email local-part, consistent with the sidebar user block. */
export const ProfileDetails = memo(function ProfileDetails({ user }: ProfileDetailsProps) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  const displayName = fullName || user.email.split('@', 1)[0];
  const initialsFirst = (user.first_name?.[0] ?? displayName[0] ?? 'U').toUpperCase();
  const initialsLast = (user.last_name?.[0] ?? displayName[1] ?? '').toUpperCase();

  const rows: { label: string; value: string | null | undefined }[] = [
    { label: 'First name', value: user.first_name },
    { label: 'Last name', value: user.last_name },
    { label: 'Phone', value: formatIndianPhone(user.phone) },
  ];

  return (
    <section className="rounded-lg border border-border bg-background">
      <div className="flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
        <UserAvatar firstName={initialsFirst} lastName={initialsLast} size={64} />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-foreground sm:text-xl">{displayName}</h2>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs capitalize text-muted-foreground">{user.role}</span>
            <span aria-hidden className="text-muted-foreground">·</span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                user.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-destructive/10 text-destructive',
              )}
            >
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 p-4 sm:grid-cols-2 sm:p-6">
        <Field label="Email" value={user.email} />
        <Field label="Role" value={user.role} capitalize />
        {rows.map((r) => (
          <Field key={r.label} label={r.label} value={r.value} />
        ))}
      </dl>
    </section>
  );
});

function Field({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string | null | undefined;
  capitalize?: boolean;
}) {
  const isSet = typeof value === 'string' && value.trim().length > 0;
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'mt-0.5 truncate text-sm',
          isSet ? 'text-foreground' : 'italic text-muted-foreground',
          capitalize && 'capitalize',
        )}
      >
        {isSet ? value : 'Not set'}
      </dd>
    </div>
  );
}
