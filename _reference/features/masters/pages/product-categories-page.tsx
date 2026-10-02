import { useState } from 'react';
import { ConfirmationPopUp } from '../../../common/confirmation-pop-up';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage } from '../../../utils/api-messages';
import { useAdminDeleteProductCategory } from '../../../sdk/inventory';
import { useProductCategories } from '../hooks/use-product-categories';
import { useMastersListState } from '../hooks/use-masters-list-state';
import { MastersSectionLayout } from '../components/masters-section-layout';
import { ProductCategoriesTable } from '../components/product-categories-table';
import { ProductCategoryDrawer } from '../components/product-category-drawer';
import type { ProductCategoryRow } from '../api/product-categories';

const SORTABLE = ['name', 'created_at'] as const;

type DrawerState =
  | { open: false }
  | { open: true; category: ProductCategoryRow | null };

export function ProductCategoriesPage() {
  const { toast } = useToast();
  const list = useMastersListState(SORTABLE);
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<ProductCategoryRow | null>(null);

  const { categories, count, isLoading, refetch } = useProductCategories({
    search: list.q,
    page: list.page,
    pageSize: list.pageSize,
    sort: list.sort,
  });

  const deleteMutation = useAdminDeleteProductCategory({
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
      title="FG Product Categories"
      backTo="/masters/products"
      backLabel="Products"
      count={count}
      searchPlaceholder="Search by name"
      searchValue={list.q}
      onSearch={list.setSearch}
      addLabel="Add category"
      onAdd={() => setDrawer({ open: true, category: null })}
    >
      <ProductCategoriesTable
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

      <ProductCategoryDrawer
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
              Delete <span className="font-medium">{deleteTarget.name}</span>? Existing products
              keep their category value; it will no longer appear in the Add-product dropdown.
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

export default ProductCategoriesPage;
