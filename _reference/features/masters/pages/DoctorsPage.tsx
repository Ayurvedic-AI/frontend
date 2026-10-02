import { useState } from 'react';
import { ConfirmationPopUp } from '../../../common/confirmation-pop-up';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage } from '../../../utils/api-messages';
import { useAdminSetDoctorStatus, useAdminUpdateDoctor } from '../../../sdk/inventory';
import { useDoctors } from '../hooks/useDoctors';
import { useMastersListState } from '../hooks/use-masters-list-state';
import { MastersSectionLayout } from '../components/masters-section-layout';
import { DoctorsTable } from '../components/DoctorsTable';
import { DoctorDrawer } from '../components/DoctorDrawer';
import { DoctorViewDrawer } from '../components/doctor-view-drawer';
import { Doctor360Drawer } from '../../payments/components/doctor-360-drawer';
import type { DoctorRow } from '../api/doctors';

const SORTABLE = ['name', 'code', 'created_at', 'is_active'] as const;

type DrawerState =
  | { open: false }
  | { open: true; doctor: DoctorRow | null };

export function DoctorsPage() {
  const { toast } = useToast();
  const list = useMastersListState(SORTABLE);
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });
  const [doctor360, setDoctor360] = useState<{ id: number; name: string } | null>(null);
  const [viewTarget, setViewTarget] = useState<DoctorRow | null>(null);
  const [statusTarget, setStatusTarget] = useState<DoctorRow | null>(null);

  const { doctors, count, isLoading, refetch } = useDoctors({
    search: list.q,
    page: list.page,
    pageSize: list.pageSize,
    sort: list.sort,
    activeOnly: list.activeOnly,
  });

  const statusMutation = useAdminSetDoctorStatus({
    mutation: {
      onSuccess: () => {
        toast({ severity: 'success', message: 'Doctor status updated.' });
        setStatusTarget(null);
        void refetch();
      },
      onError: (error) => toast({ severity: 'error', message: errorMessage(error) }),
    },
  });

  const vipMutation = useAdminUpdateDoctor({
    mutation: {
      onSuccess: (_res, vars) => {
        toast({
          severity: 'success',
          message: vars.data.is_vip ? 'Marked as VIP.' : 'Removed from VIP.',
        });
        void refetch();
      },
      onError: (error) => toast({ severity: 'error', message: errorMessage(error) }),
    },
  });

  return (
    <MastersSectionLayout
      title="Doctors"
      // description="Customer master — clinics, contact and billing state."
      count={count}
      searchPlaceholder="Search by name, code, clinic or city"
      searchValue={list.q}
      onSearch={list.setSearch}
      addLabel="Add doctor"
      onAdd={() => setDrawer({ open: true, doctor: null })}
      activeOnly={list.activeOnly}
      onActiveOnlyChange={list.setActiveOnly}
    >
      <DoctorsTable
        doctors={doctors}
        loading={isLoading}
        rowCount={count}
        pageIndex={list.page}
        pageSize={list.pageSize}
        sorting={list.sorting}
        onPaginationChange={list.setPagination}
        onSortingChange={list.setSorting}
        onView={setViewTarget}
        onEdit={(doctor) => setDrawer({ open: true, doctor })}
        onToggleStatus={setStatusTarget}
        onToggleVip={(doctor) => vipMutation.mutate({ doctorId: doctor.id, data: { is_vip: !doctor.is_vip } })}
        onDoctor360={(doctor) => setDoctor360({ id: doctor.id, name: doctor.name })}
      />

      <Doctor360Drawer doctor={doctor360} onClose={() => setDoctor360(null)} />

      <DoctorViewDrawer
        open={viewTarget !== null}
        doctor={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={(doctor) => {
          setViewTarget(null);
          setDrawer({ open: true, doctor });
        }}
        onDoctor360={(doctor) => {
          setViewTarget(null);
          setDoctor360({ id: doctor.id, name: doctor.name });
        }}
      />

      <DoctorDrawer
        open={drawer.open}
        doctor={drawer.open ? drawer.doctor : null}
        onClose={() => setDrawer({ open: false })}
        onSaved={() => void refetch()}
      />

      <ConfirmationPopUp
        open={statusTarget !== null}
        onClose={() => setStatusTarget(null)}
        onConfirm={() =>
          statusTarget &&
          statusMutation.mutate({ doctorId: statusTarget.id, data: { is_active: !statusTarget.is_active } })
        }
        title={statusTarget?.is_active ? 'Deactivate doctor' : 'Activate doctor'}
        message={
          statusTarget ? (
            <>
              {statusTarget.is_active ? 'Deactivate' : 'Activate'}{' '}
              <span className="font-medium">{statusTarget.name}</span>?{' '}
              {statusTarget.is_active
                ? 'Existing references keep working; it will be hidden from “Active only” views.'
                : 'It will be selectable again.'}
            </>
          ) : null
        }
        confirmLabel={statusTarget?.is_active ? 'Deactivate' : 'Activate'}
        destructive={statusTarget?.is_active ?? false}
        confirmDisabled={statusMutation.isPending}
      />
    </MastersSectionLayout>
  );
}

export default DoctorsPage;
