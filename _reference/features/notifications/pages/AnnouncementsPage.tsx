import { useState } from 'react';
import { Megaphone, Plus } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { CustomSelect } from '../../../common/custom-select';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import { useAnnouncementsList } from '../hooks/useAnnouncements';
import {
  useAnnouncementSchedulesList,
  useUpdateAnnouncementSchedule,
} from '../hooks/use-announcement-schedules';
import { SEVERITY_ITEMS } from '../hooks/useAnnouncementForm';
import { PermissionButton, usePermissions } from '../../auth/permissions';
import { AnnouncementComposerDrawer } from '../components/AnnouncementComposerDrawer';
import { AnnouncementsTable } from '../components/announcements-table';
import { AnnouncementDetailDrawer } from '../components/announcement-detail-drawer';
import { AnnouncementSchedulesTable } from '../components/announcement-schedules-table';
import { AnnouncementScheduleDetailDrawer } from '../components/announcement-schedule-detail-drawer';
import type { AnnouncementOut } from '../api/notifications';
import type { AnnouncementScheduleOut, ScheduleStatusUpdate } from '../api/announcement-schedules';

type TabKey = 'announcements' | 'recurring';

// "All" uses a sentinel value — Radix Select items cannot carry an empty value.
const SEVERITY_FILTER_ITEMS = [{ value: 'ALL', label: 'All severities' }, ...SEVERITY_ITEMS];

export function AnnouncementsPage() {
  const perms = usePermissions();
  const canViewAnnouncements = perms.has('announcements.view');
  const { toast } = useToast();

  const [tab, setTab] = useState<TabKey>('announcements');
  const [composerOpen, setComposerOpen] = useState(false);
  const [selected, setSelected] = useState<AnnouncementOut | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<AnnouncementScheduleOut | null>(null);
  const [severity, setSeverity] = useState('ALL');

  const announcements = useAnnouncementsList();
  const schedules = useAnnouncementSchedulesList();
  const updateSchedule = useUpdateAnnouncementSchedule();

  if (!canViewAnnouncements) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-sm text-muted-foreground">You don&rsquo;t have access to announcements.</p>
      </div>
    );
  }

  const items = announcements.data?.items ?? [];
  const filtered = severity === 'ALL' ? items : items.filter((a) => a.severity === severity);
  const scheduleItems = schedules.data?.items ?? [];

  const announcementsEmpty = (
    <div className="py-12 text-center text-sm text-muted-foreground">
      {items.length === 0 ? 'No announcements sent yet.' : 'No announcements match the selected severity.'}
    </div>
  );
  const schedulesEmpty = (
    <div className="py-12 text-center text-sm text-muted-foreground">No recurring announcements yet.</div>
  );

  const runAction = (uuid: string, action: ScheduleStatusUpdate['action']) =>
    updateSchedule.mutate(
      { scheduleUuid: uuid, data: { action } },
      {
        onSuccess: (response) =>
          toast({ severity: 'success', message: successMessage(response, 'Schedule updated.') }),
        onError: (error) => toast({ severity: 'error', message: errorMessage(error) }),
      },
    );

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'announcements', label: 'Announcements' },
    { key: 'recurring', label: 'Recurring' },
  ];

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Megaphone className="size-5 text-primary" aria-hidden />
          <h1 className="text-lg font-semibold text-foreground">Announcements</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {tab === 'announcements' && (
            <div className="w-44">
              <CustomSelect
                name="severity-filter"
                placeholder="All severities"
                value={severity}
                items={SEVERITY_FILTER_ITEMS}
                onChange={(e) => setSeverity(e.target.value)}
              />
            </div>
          )}
          <PermissionButton
            permission="announcements.create"
            deniedTooltip="You don't have permission to do that"
            variant="primary"
            size="md"
            onClick={() => setComposerOpen(true)}
          >
            <Plus className="mr-1 size-4" aria-hidden />
            New announcement
          </PermissionButton>
        </div>
      </div>

      {/* Tabs (underline style) */}
      <div className="flex items-end gap-1 border-b border-border">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none',
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'announcements' &&
        (announcements.isError ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Couldn&rsquo;t load announcements.</p>
        ) : (
          // `key={severity}` resets pagination to the first page when the filter changes.
          <AnnouncementsTable
            key={severity}
            announcements={filtered}
            loading={announcements.isPending}
            onView={setSelected}
            emptyState={announcementsEmpty}
          />
        ))}

      {tab === 'recurring' &&
        (schedules.isError ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Couldn&rsquo;t load recurring announcements.</p>
        ) : (
          <AnnouncementSchedulesTable
            schedules={scheduleItems}
            loading={schedules.isPending}
            busy={updateSchedule.isPending}
            canManage={perms.has('announcements.create')}
            onView={setSelectedSchedule}
            onPause={(uuid) => runAction(uuid, 'PAUSE')}
            onResume={(uuid) => runAction(uuid, 'RESUME')}
            onCancel={(uuid) => runAction(uuid, 'CANCEL')}
            emptyState={schedulesEmpty}
          />
        ))}

      <AnnouncementDetailDrawer announcement={selected} onClose={() => setSelected(null)} />
      <AnnouncementScheduleDetailDrawer
        // Resolve from the live list so Pause/Resume from inside the drawer
        // updates the status chip/buttons without reopening.
        schedule={
          selectedSchedule
            ? scheduleItems.find((s) => s.uuid === selectedSchedule.uuid) ?? selectedSchedule
            : null
        }
        onClose={() => setSelectedSchedule(null)}
        canManage={perms.has('announcements.create')}
        busy={updateSchedule.isPending}
        onPause={(uuid) => runAction(uuid, 'PAUSE')}
        onResume={(uuid) => runAction(uuid, 'RESUME')}
        onCancel={(uuid) => {
          setSelectedSchedule(null);
          runAction(uuid, 'CANCEL');
        }}
      />

      <AnnouncementComposerDrawer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSent={() => {
          setSelected(null);
          setSelectedSchedule(null);
        }}
      />
    </div>
  );
}
