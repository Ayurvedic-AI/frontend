import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmationPopUp } from '../../../common/confirmation-pop-up';
import { CustomButton } from '../../../common/custom-buttons';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage } from '../../../utils/api-messages';
import { useAdminDeleteRawMaterial } from '../../../sdk/inventory';
import { useRawMaterials } from '../hooks/useRawMaterials';
import { useMastersListState } from '../hooks/use-masters-list-state';
import { MastersSectionLayout } from '../components/masters-section-layout';
import { RawMaterialsTable } from '../components/RawMaterialsTable';
import { RawMaterialDrawer } from '../components/RawMaterialDrawer';
import { RawMaterialViewDrawer } from '../components/raw-material-view-drawer';
import type { RawMaterialRow } from '../api/raw-materials';

const SORTABLE = ['name', 'code', 'created_at'] as const;

type DrawerState =
  | { open: false }
  | { open: true; material: RawMaterialRow | null };

export function RawMaterialsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const list = useMastersListState(SORTABLE);
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });
  const [viewTarget, setViewTarget] = useState<RawMaterialRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RawMaterialRow | null>(null);

  const { materials, count, isLoading, refetch } = useRawMaterials({
    search: list.q,
    page: list.page,
    pageSize: list.pageSize,
    sort: list.sort,
  });

  const deleteMutation = useAdminDeleteRawMaterial({
    mutation: {
      onSuccess: () => {
        toast({ severity: 'success', message: 'Raw material deleted.' });
        setDeleteTarget(null);
        void refetch();
      },
      onError: (error) => toast({ severity: 'error', message: errorMessage(error) }),
    },
  });

  return (
    <MastersSectionLayout
      title="Raw Materials"
      count={count}
      searchPlaceholder="Search by name or code"
      searchValue={list.q}
      onSearch={list.setSearch}
      addLabel="Add raw material"
      onAdd={() => setDrawer({ open: true, material: null })}
      extraActions={
        <CustomButton variant="outline" onClick={() => navigate('/masters/category-types?from=raw-materials')}>
          Manage categories
        </CustomButton>
      }
    >
      <RawMaterialsTable
        materials={materials}
        loading={isLoading}
        rowCount={count}
        pageIndex={list.page}
        pageSize={list.pageSize}
        sorting={list.sorting}
        onPaginationChange={list.setPagination}
        onSortingChange={list.setSorting}
        onView={setViewTarget}
        onEdit={(material) => setDrawer({ open: true, material })}
        onDelete={setDeleteTarget}
      />

      <RawMaterialViewDrawer
        open={viewTarget !== null}
        material={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={(material) => {
          setViewTarget(null);
          setDrawer({ open: true, material });
        }}
      />

      <RawMaterialDrawer
        open={drawer.open}
        material={drawer.open ? drawer.material : null}
        onClose={() => setDrawer({ open: false })}
        onSaved={() => void refetch()}
      />

      <ConfirmationPopUp
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate({ materialId: deleteTarget.id })}
        title="Delete raw material"
        message={
          deleteTarget ? (
            <>
              Delete <span className="font-medium">{deleteTarget.name}</span>? This permanently removes
              the raw material. This cannot be undone.
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

export default RawMaterialsPage;
