import { useState } from 'react';
import { ConfirmationPopUp } from '../../../common/confirmation-pop-up';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage } from '../../../utils/api-messages';
import { useAdminSetVendorStatus } from '../../../sdk/inventory';
import { useVendors } from '../hooks/useVendors';
import { useMastersListState } from '../hooks/use-masters-list-state';
import { MastersSectionLayout } from '../components/masters-section-layout';
import { VendorsTable } from '../components/VendorsTable';
import { VendorDrawer } from '../components/VendorDrawer';
import { VendorViewDrawer } from '../components/vendor-view-drawer';
import type { VendorRow } from '../api/vendors';

const SORTABLE = ['name', 'code', 'created_at', 'is_active'] as const;

type DrawerState =
  | { open: false }
  | { open: true; vendor: VendorRow | null };

export function VendorsPage() {
  const { toast } = useToast();
  const list = useMastersListState(SORTABLE);
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });
  const [viewVendor, setViewVendor] = useState<VendorRow | null>(null);
  const [statusTarget, setStatusTarget] = useState<VendorRow | null>(null);

  const { vendors, count, isLoading, refetch } = useVendors({
    search: list.q,
    page: list.page,
    pageSize: list.pageSize,
    sort: list.sort,
    activeOnly: list.activeOnly,
  });

  const statusMutation = useAdminSetVendorStatus({
    mutation: {
      onSuccess: () => {
        toast({ severity: 'success', message: 'Vendor status updated.' });
        setStatusTarget(null);
        void refetch();
      },
      onError: (error) => toast({ severity: 'error', message: errorMessage(error) }),
    },
  });

  return (
    <MastersSectionLayout
      title="Vendors"
      // description=""
      count={count}
      searchPlaceholder="Search by name, code or city"
      searchValue={list.q}
      onSearch={list.setSearch}
      addLabel="Add vendor"
      onAdd={() => setDrawer({ open: true, vendor: null })}
      activeOnly={list.activeOnly}
      onActiveOnlyChange={list.setActiveOnly}
    >
      <VendorsTable
        vendors={vendors}
        loading={isLoading}
        rowCount={count}
        pageIndex={list.page}
        pageSize={list.pageSize}
        sorting={list.sorting}
        onPaginationChange={list.setPagination}
        onSortingChange={list.setSorting}
        onView={setViewVendor}
        onEdit={(vendor) => setDrawer({ open: true, vendor })}
        onToggleStatus={setStatusTarget}
      />

      <VendorViewDrawer
        open={viewVendor !== null}
        vendor={viewVendor}
        onClose={() => setViewVendor(null)}
        onEdit={(vendor) => {
          setViewVendor(null);
          setDrawer({ open: true, vendor });
        }}
      />

      <VendorDrawer
        open={drawer.open}
        vendor={drawer.open ? drawer.vendor : null}
        onClose={() => setDrawer({ open: false })}
        onSaved={() => void refetch()}
      />

      <ConfirmationPopUp
        open={statusTarget !== null}
        onClose={() => setStatusTarget(null)}
        onConfirm={() =>
          statusTarget &&
          statusMutation.mutate({ vendorId: statusTarget.id, data: { is_active: !statusTarget.is_active } })
        }
        title={statusTarget?.is_active ? 'Deactivate vendor' : 'Activate vendor'}
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

export default VendorsPage;
