import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { RHFAutocomplete, RHFCheckbox, RHFDatePicker, RHFInput, RHFSelect, RHFTextarea } from '../../../common/rhf-wrappers';
import { CustomLabel } from '../../../common/custom-label';
import { useToast } from '../../../common/common-snackbar';
import { useFormApiErrors } from '../../../hooks/useFormApiErrors';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import { useCreateAnnouncement } from '../hooks/useAnnouncements';
import { useCreateAnnouncementSchedule } from '../hooks/use-announcement-schedules';
import type { AnnouncementOut, Envelope } from '../api/notifications';
import type { AnnouncementScheduleOut } from '../api/announcement-schedules';
import { getAdminListRolesQueryOptions } from '../../../sdk/roles-permissions';
import type { RoleList } from '../../../sdk/schemas';
import {
  INTERVAL_ITEMS,
  MODE_ITEMS,
  SEVERITY_ITEMS,
  roleLabel,
  toAnnouncementBody,
  toScheduleBody,
  useAnnouncementForm,
  type AnnouncementFormValues,
} from '../hooks/useAnnouncementForm';

interface AnnouncementComposerDrawerProps {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}

export function AnnouncementComposerDrawer({ open, onClose, onSent }: AnnouncementComposerDrawerProps) {
  const { toast } = useToast();
  const { control, handleSubmit, reset, setError, watch } = useAnnouncementForm();
  const { handleApiError } = useFormApiErrors(setError);
  const createMutation = useCreateAnnouncement();
  const scheduleMutation = useCreateAnnouncementSchedule();

  // Audience = "All users" + every ACTIVE role from the roles master, by name
  // (the backend targets users whose role matches the name), loaded dynamically
  // so new custom roles appear without a code change.
  const rolesQuery = useQuery({
    ...getAdminListRolesQueryOptions({ status: 'active', limit: 100 }),
    enabled: open,
  });
  const rolesData = rolesQuery.data as { data?: RoleList } | undefined;
  const audienceItems = useMemo(() => {
    const roles = rolesData?.data?.items ?? [];
    return [
      { key: 'ALL', value: 'All users' },
      ...roles.map((r) => ({ key: `ROLE:${r.name}`, value: roleLabel(r.name) })),
    ];
  }, [rolesData]);

  const mode = watch('mode');
  const intervalChoice = watch('interval_choice');
  const isRecurring = mode === 'recurring';
  const pending = createMutation.isPending || scheduleMutation.isPending;

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: AnnouncementFormValues) => {
    const onError = (error: unknown) => {
      const general = handleApiError(error);
      toast({ severity: 'error', message: general ?? errorMessage(error) });
    };

    if (isRecurring) {
      scheduleMutation.mutate(
        { data: toScheduleBody(data) },
        {
          onSuccess: (response) => {
            const created = (response as Envelope<AnnouncementScheduleOut>).data;
            toast({
              severity: 'success',
              message: successMessage(
                response,
                `Recurring announcement started — first sent to ${created.recipient_count ?? 0} recipient(s).`,
              ),
            });
            reset();
            onSent();
            onClose();
          },
          onError,
        },
      );
      return;
    }

    createMutation.mutate(
      { data: toAnnouncementBody(data) },
      {
        onSuccess: (response) => {
          const created = (response as Envelope<AnnouncementOut>).data;
          toast({
            severity: 'success',
            message: successMessage(response, `Announcement sent to ${created.recipient_count} recipient(s).`),
          });
          reset();
          onSent();
          onClose();
        },
        onError,
      },
    );
  };

  return (
    <CustomDrawer
      anchor="right"
      title="New announcement"
      open={open}
      onClose={handleClose}
      drawerWidth="44rem"
      drawerPadding="0px"
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex min-h-full flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <CustomLabel label="Audience" htmlFor="audience_choice" isRequired />
                <RHFAutocomplete
                  control={control}
                  name="audience_choice"
                  options={audienceItems}
                  hasStartSearchIcon
                  placeholder={rolesQuery.isPending ? 'Loading roles…' : 'Search role or all users…'}
                />
              </div>
              <RHFSelect control={control} name="severity" label="Severity" placeholder="Select severity" items={SEVERITY_ITEMS} />
            </div>
            <RHFInput control={control} name="title" label="Title" required placeholder="Short headline" />
            <RHFTextarea control={control} name="message" label="Message" required placeholder="What do you want people to know?" minRow={4} />
            <RHFCheckbox
              control={control}
              name="requires_acknowledgment"
              label="Require acknowledgment"
              supportingText="Recipients must explicitly acknowledge; it stays pinned until they do."
            />

            {/* Recurrence (feature 053) */}
            <div className="rounded-lg border border-border p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <RHFSelect control={control} name="mode" label="Frequency" placeholder="Frequency" items={MODE_ITEMS} />
                {isRecurring && (
                  <RHFSelect control={control} name="interval_choice" label="Repeat every" placeholder="Repeat every" items={INTERVAL_ITEMS} />
                )}
              </div>
              {isRecurring && (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {intervalChoice === 'custom' && (
                    <RHFInput
                      control={control}
                      name="interval_custom_days"
                      label="Every N days"
                      placeholder="1–365"
                    />
                  )}
                  <RHFDatePicker control={control} name="end_date" label="End date (optional)" placeholder="Runs until cancelled" />
                </div>
              )}
              {isRecurring && (
                <p className="mt-3 text-xs text-muted-foreground">
                  The first notification is sent now, then it repeats on the chosen cadence until you pause or cancel it.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 justify-end gap-3 border-t border-border bg-background px-6 py-4">
          <CustomButton type="button" variant="outline" onClick={handleClose} size="md">
            Cancel
          </CustomButton>
          <CustomButton type="submit" variant="primary" loading={pending} size="md">
            {isRecurring ? 'Start recurring announcement' : 'Send announcement'}
          </CustomButton>
        </div>
      </form>
    </CustomDrawer>
  );
}
