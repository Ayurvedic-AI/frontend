import { useState } from 'react';
import { ConfirmationPopUp } from '../../../common/confirmation-pop-up';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage } from '../../../utils/api-messages';
import { useAdminDeleteStoreType } from '../../../sdk/inventory';
import { useStoreTypes } from '../hooks/use-store-types';
import { useMastersListState } from '../hooks/use-masters-list-state';
import { MastersSectionLayout } from '../components/masters-section-layout';
import { StoreTypesTable } from '../components/store-types-table';
import { StoreTypeDrawer } from '../components/store-type-drawer';
import type { StoreTypeRow } from '../api/store-types';

// Store Types are name-only with no status; sortable on name + created_at.
const SORTABLE = ['name', 'created_at'] as const;

type DrawerState = { open: false } | { open: true; type: StoreTypeRow | null };

export function StoreTypesPage() {
  const { toast } = useToast();
  const list = useMastersListState(SORTABLE);
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<StoreTypeRow | null>(null);

  const { storeTypes, count, isLoading, refetch } = useStoreTypes({
    search: list.q,
    page: list.page,
    pageSize: list.pageSize,
    sort: list.sort,
  });

  const deleteMutation = useAdminDeleteStoreType({
    mutation: {
      onSuccess: () => {
        toast({ severity: 'success', message: 'Store type deleted.' });
        setDeleteTarget(null);
        void refetch();
      },
      onError: (error) => toast({ severity: 'error', message: errorMessage(error) }),
    },
  });

  return (
    <MastersSectionLayout
      title="Store Types"
      // Reached from Masters → Stores ("Manage store types"), so back returns
      // there — not the Masters hub (#223).
      backTo="/masters/stores"
      backLabel="Stores"
      count={count}
      searchPlaceholder="Search by name"
      searchValue={list.q}
      onSearch={list.setSearch}
      addLabel="Add type"
      onAdd={() => setDrawer({ open: true, type: null })}
    >
      <StoreTypesTable
        storeTypes={storeTypes}
        loading={isLoading}
        rowCount={count}
        pageIndex={list.page}
        pageSize={list.pageSize}
        sorting={list.sorting}
        onPaginationChange={list.setPagination}
        onSortingChange={list.setSorting}
        onEdit={(type) => setDrawer({ open: true, type })}
        onDelete={setDeleteTarget}
      />

      <StoreTypeDrawer
        open={drawer.open}
        type={drawer.open ? drawer.type : null}
        onClose={() => setDrawer({ open: false })}
        onSaved={() => void refetch()}
      />

      <ConfirmationPopUp
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate({ typeId: deleteTarget.id })}
        title="Delete store type"
        message={
          deleteTarget ? (
            <>
              Delete <span className="font-medium">{deleteTarget.name}</span>? This removes it from any
              stores using it (their Store Type becomes blank). This cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete"
        destructive
        confirmDisabled={deleteMutation.isPending}
      />
    </MastersSectionLayout>
  );
}

export default StoreTypesPage;
