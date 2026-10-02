import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileUp } from 'lucide-react';
import { ConfirmationPopUp } from '../../../common/confirmation-pop-up';
import { CustomButton } from '../../../common/custom-buttons';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage } from '../../../utils/api-messages';
import { useAdminSetProductStatus } from '../../../sdk/inventory';
import { PermissionButton } from '../../auth/permissions';
import { useProducts } from '../hooks/useProducts';
import { useMastersListState } from '../hooks/use-masters-list-state';
import { MastersSectionLayout } from '../components/masters-section-layout';
import { ProductsTable } from '../components/ProductsTable';
import { ProductDrawer } from '../components/ProductDrawer';
import { ProductImportDrawer } from '../components/product-import-drawer';
import { ProductViewDrawer } from '../components/product-view-drawer';
import type { ProductRow } from '../api/products';

const SORTABLE = ['name', 'code', 'created_at', 'is_active'] as const;

type DrawerState =
  | { open: false }
  | { open: true; product: ProductRow | null };

export function ProductsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const list = useMastersListState(SORTABLE);
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });
  const [importOpen, setImportOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<ProductRow | null>(null);
  const [statusTarget, setStatusTarget] = useState<ProductRow | null>(null);

  const { products, count, isLoading, refetch } = useProducts({
    search: list.q,
    page: list.page,
    pageSize: list.pageSize,
    sort: list.sort,
    activeOnly: list.activeOnly,
  });

  const statusMutation = useAdminSetProductStatus({
    mutation: {
      onSuccess: () => {
        toast({ severity: 'success', message: 'Product status updated.' });
        setStatusTarget(null);
        void refetch();
      },
      onError: (error) => toast({ severity: 'error', message: errorMessage(error) }),
    },
  });

  return (
    <MastersSectionLayout
      title="Finished Good Products"
      // description=""
      count={count}
      searchPlaceholder="Search by name, code or HSN"
      searchValue={list.q}
      onSearch={list.setSearch}
      addLabel="Add product"
      onAdd={() => setDrawer({ open: true, product: null })}
      activeOnly={list.activeOnly}
      onActiveOnlyChange={list.setActiveOnly}
      extraActions={
        <>
          <PermissionButton
            permission="masters.create"
            deniedTooltip="You don't have permission to import products"
            variant="outline"
            icon={<FileUp className="size-4" />}
            onClick={() => setImportOpen(true)}
          >
            Import
          </PermissionButton>
           <CustomButton variant="outline" onClick={() => navigate('/masters/product-categories')}>
            Manage categories
          </CustomButton>
        </>
      }
    >
      <ProductsTable
        products={products}
        loading={isLoading}
        rowCount={count}
        pageIndex={list.page}
        pageSize={list.pageSize}
        sorting={list.sorting}
        onPaginationChange={list.setPagination}
        onSortingChange={list.setSorting}
        onView={setViewTarget}
        onEdit={(product) => setDrawer({ open: true, product })}
        onToggleStatus={setStatusTarget}
      />

      <ProductViewDrawer
        open={viewTarget !== null}
        product={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={(product) => {
          setViewTarget(null);
          setDrawer({ open: true, product });
        }}
      />

      <ProductDrawer
        open={drawer.open}
        product={drawer.open ? drawer.product : null}
        onClose={() => setDrawer({ open: false })}
        onSaved={() => void refetch()}
      />

      <ProductImportDrawer
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => void refetch()}
      />

      <ConfirmationPopUp
        open={statusTarget !== null}
        onClose={() => setStatusTarget(null)}
        onConfirm={() =>
          statusTarget &&
          statusMutation.mutate({ productId: statusTarget.id, data: { is_active: !statusTarget.is_active } })
        }
        title={statusTarget?.is_active ? 'Deactivate product' : 'Activate product'}
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

export default ProductsPage;
