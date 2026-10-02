import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmationPopUp } from '../../../common/confirmation-pop-up';
import { CustomButton } from '../../../common/custom-buttons';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage } from '../../../utils/api-messages';
import { useAdminDeleteSemiFinishedGood } from '../../../sdk/inventory';
import { useSemiFinishedGoods } from '../hooks/useSemiFinishedGoods';
import { useMastersListState } from '../hooks/use-masters-list-state';
import { MastersSectionLayout } from '../components/masters-section-layout';
import { SemiFinishedGoodsTable } from '../components/SemiFinishedGoodsTable';
import { SemiFinishedGoodDrawer } from '../components/SemiFinishedGoodDrawer';
import { SfgViewDrawer } from '../components/sfg-view-drawer';
import type { SemiFinishedGoodRow } from '../api/semi-finished-goods';

const SORTABLE = ['name', 'code', 'created_at'] as const;

type DrawerState =
  | { open: false }
  | { open: true; sfg: SemiFinishedGoodRow | null };

export function SemiFinishedGoodsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const list = useMastersListState(SORTABLE);
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<SemiFinishedGoodRow | null>(null);
  const [viewTarget, setViewTarget] = useState<SemiFinishedGoodRow | null>(null);

  const { semiFinishedGoods, count, isLoading, refetch } = useSemiFinishedGoods({
    search: list.q,
    page: list.page,
    pageSize: list.pageSize,
    sort: list.sort,
  });

  const deleteMutation = useAdminDeleteSemiFinishedGood({
    mutation: {
      onSuccess: () => {
        toast({ severity: 'success', message: 'Semi-finished good deleted.' });
        setDeleteTarget(null);
        void refetch();
      },
      onError: (error) => toast({ severity: 'error', message: errorMessage(error) }),
    },
  });

  return (
    <MastersSectionLayout
      title="Semi-Finished Goods"
      count={count}
      searchPlaceholder="Search by name or code"
      searchValue={list.q}
      onSearch={list.setSearch}
      addLabel="Add semi-finished good"
      onAdd={() => setDrawer({ open: true, sfg: null })}
      extraActions={
        <CustomButton variant="outline" onClick={() => navigate('/masters/sfg-categories')}>
          Manage categories
        </CustomButton>
      }
    >
      <SemiFinishedGoodsTable
        semiFinishedGoods={semiFinishedGoods}
        loading={isLoading}
        rowCount={count}
        pageIndex={list.page}
        pageSize={list.pageSize}
        sorting={list.sorting}
        onPaginationChange={list.setPagination}
        onSortingChange={list.setSorting}
        onView={setViewTarget}
        onEdit={(sfg) => setDrawer({ open: true, sfg })}
        onDelete={setDeleteTarget}
      />

      <SfgViewDrawer
        open={viewTarget !== null}
        sfg={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={(sfg) => {
          setViewTarget(null);
          setDrawer({ open: true, sfg });
        }}
      />

      <SemiFinishedGoodDrawer
        open={drawer.open}
        sfg={drawer.open ? drawer.sfg : null}
        onClose={() => setDrawer({ open: false })}
        onSaved={() => void refetch()}
      />

      <ConfirmationPopUp
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate({ sfgId: deleteTarget.id })}
        title="Delete semi-finished good"
        message={
          deleteTarget ? (
            <>
              Delete <span className="font-medium">{deleteTarget.name}</span>? This permanently removes
              the semi-finished good. This cannot be undone.
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

export default SemiFinishedGoodsPage;
