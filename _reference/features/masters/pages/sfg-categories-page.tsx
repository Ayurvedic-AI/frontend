import { useState } from 'react';
import { ConfirmationPopUp } from '../../../common/confirmation-pop-up';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage } from '../../../utils/api-messages';
import { useAdminDeleteSfgCategory } from '../../../sdk/inventory';
import { useSfgCategories } from '../hooks/use-sfg-categories';
import { useMastersListState } from '../hooks/use-masters-list-state';
import { MastersSectionLayout } from '../components/masters-section-layout';
import { SfgCategoriesTable } from '../components/sfg-categories-table';
import { SfgCategoryDrawer } from '../components/sfg-category-drawer';
import type { SfgCategoryRow } from '../api/sfg-categories';

const SORTABLE = ['name', 'created_at'] as const;

type DrawerState =
  | { open: false }
  | { open: true; category: SfgCategoryRow | null };

export function SfgCategoriesPage() {
  const { toast } = useToast();
  const list = useMastersListState(SORTABLE);
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<SfgCategoryRow | null>(null);

  const { categories, count, isLoading, refetch } = useSfgCategories({
    search: list.q,
    page: list.page,
    pageSize: list.pageSize,
    sort: list.sort,
  });

  const deleteMutation = useAdminDeleteSfgCategory({
    mutation: {
      onSuccess: () => {
        toast({ severity: 'success', message: 'Category deleted.' });
        setDeleteTarget(null);
        void refetch();
      },
      onError: (error) => toast({ severity: 'error', message: errorMessage(error) }),
    },
  });

  return (
    <MastersSectionLayout
      title="SFG Categories"
      backTo="/masters/semi-finished-goods"
      backLabel="Semi-Finished Goods"
      count={count}
      searchPlaceholder="Search by name"
      searchValue={list.q}
      onSearch={list.setSearch}
      addLabel="Add category"
      onAdd={() => setDrawer({ open: true, category: null })}
    >
      <SfgCategoriesTable
        categories={categories}
        loading={isLoading}
        rowCount={count}
        pageIndex={list.page}
        pageSize={list.pageSize}
        sorting={list.sorting}
        onPaginationChange={list.setPagination}
        onSortingChange={list.setSorting}
        onEdit={(category) => setDrawer({ open: true, category })}
        onDelete={setDeleteTarget}
      />

      <SfgCategoryDrawer
        open={drawer.open}
        category={drawer.open ? drawer.category : null}
        onClose={() => setDrawer({ open: false })}
        onSaved={() => void refetch()}
      />

      <ConfirmationPopUp
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate({ categoryId: deleteTarget.id })}
        title="Delete category"
        message={
          deleteTarget ? (
            <>
              Delete <span className="font-medium">{deleteTarget.name}</span>? Semi-finished goods
              linked to it keep working but lose the category; it will no longer appear in the
              Add-SFG dropdown.
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

export default SfgCategoriesPage;
