import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConfirmationPopUp } from '../../../common/confirmation-pop-up';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage } from '../../../utils/api-messages';
import { useAdminDeleteCategoryType } from '../../../sdk/inventory';
import { useCategoryTypes } from '../hooks/use-category-types';
import { useMastersListState } from '../hooks/use-masters-list-state';
import { MastersSectionLayout } from '../components/masters-section-layout';
import { CategoryTypesTable } from '../components/category-types-table';
import { CategoryTypeDrawer } from '../components/category-type-drawer';
import type { CategoryTypeRow } from '../api/category-types';

// Category Types are name-only with no status; sortable on name + created_at.
const SORTABLE = ['name', 'created_at'] as const;

type DrawerState = { open: false } | { open: true; type: CategoryTypeRow | null };

export function CategoryTypesPage() {
  const { toast } = useToast();
  const list = useMastersListState(SORTABLE, undefined, 10);
  const [searchParams] = useSearchParams();
  const back =
    searchParams.get('from') === 'semi-finished-goods'
      ? { to: '/masters/semi-finished-goods', label: 'Semi-Finished Goods' }
      : searchParams.get('from') === 'raw-materials'
      ? { to: '/masters/raw-materials', label: 'Raw Materials' }
      : { to: '/masters', label: 'Masters' };
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<CategoryTypeRow | null>(null);

  const { categoryTypes, count, isLoading, refetch } = useCategoryTypes({
    search: list.q,
    page: list.page,
    pageSize: list.pageSize,
    sort: list.sort,
  });

  const deleteMutation = useAdminDeleteCategoryType({
    mutation: {
      onSuccess: () => {
        toast({ severity: 'success', message: 'Category type deleted.' });
        setDeleteTarget(null);
        void refetch();
      },
      onError: (error) => toast({ severity: 'error', message: errorMessage(error) }),
    },
  });

  return (
    <MastersSectionLayout
      title="Category Types"
      backTo={back.to}
      backLabel={back.label}
      count={count}
      searchPlaceholder="Search by name"
      searchValue={list.q}
      onSearch={list.setSearch}
      addLabel="Add type"
      onAdd={() => setDrawer({ open: true, type: null })}
    >
      <CategoryTypesTable
        categoryTypes={categoryTypes}
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

      <CategoryTypeDrawer
        open={drawer.open}
        type={drawer.open ? drawer.type : null}
        onClose={() => setDrawer({ open: false })}
        onSaved={() => void refetch()}
      />

      <ConfirmationPopUp
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate({ typeId: deleteTarget.id })}
        title="Delete category type"
        message={
          deleteTarget ? (
            <>
              Delete <span className="font-medium">{deleteTarget.name}</span>? This removes it from any
              RM categories using it (their Type becomes blank). This cannot be undone.
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

export default CategoryTypesPage;
