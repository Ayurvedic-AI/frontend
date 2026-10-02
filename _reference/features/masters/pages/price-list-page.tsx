/**
 * Masters → Price List (feature 070): the in-app replacement for the legacy
 * price spreadsheet. Flat table with a Category column + CustomSelect filter,
 * View/Edit drawers, bulk import, and delete.
 */
import { useMemo, useState } from 'react';
import { Upload } from 'lucide-react';
import { CustomButton } from '../../../common/custom-buttons';
import { CustomSelect } from '../../../common/custom-select';
import { ConfirmationPopUp } from '../../../common/confirmation-pop-up';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage } from '../../../utils/api-messages';
import { useAdminDeletePriceList } from '../../../sdk/inventory';
import { MastersSectionLayout } from '../components/masters-section-layout';
import { PriceListTable } from '../components/price-list-table';
import { PriceListDrawer } from '../components/price-list-drawer';
import { PriceListViewDrawer } from '../components/price-list-view-drawer';
import { PriceListImportDrawer } from '../components/price-list-import-drawer';
import { usePriceList } from '../hooks/use-price-list';
import { useProductCategories } from '../hooks/use-product-categories';
import { useRmCategories } from '../hooks/use-rm-categories';
import type { PriceListRow } from '../api/price-list';

type DrawerState = { open: false } | { open: true; row: PriceListRow | null };

export function PriceListPage() {
  const { toast } = useToast();
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });
  const [viewRow, setViewRow] = useState<PriceListRow | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PriceListRow | null>(null);
  const list = usePriceList();
  const { categories } = useProductCategories({ page: 0, pageSize: 100, sort: 'name', activeOnly: true });
  const { categories: rmCategories } = useRmCategories({ page: 0, pageSize: 100, sort: 'name' });

  // Product + raw-material categories in ONE filter, under disabled section
  // labels (073 stock-tab pattern). Filtering matches either kind server-side.
  const categoryItems = useMemo(() => {
    const items: { value: string; label: string; disabled?: boolean }[] = [];
    if (categories.length) {
      items.push({ value: '__fg__', label: 'Finished goods', disabled: true });
      items.push(...categories.map((c) => ({ value: c.name, label: c.name })));
    }
    // A name present in BOTH masters would duplicate the select value (and the
    // server filter matches either kind anyway) — list it once, under FG.
    const seen = new Set(categories.map((c) => c.name));
    const rmOnly = rmCategories.filter((c) => !seen.has(c.name));
    if (rmOnly.length) {
      items.push({ value: '__rm__', label: 'Raw materials', disabled: true });
      items.push(...rmOnly.map((c) => ({ value: c.name, label: c.name })));
    }
    return items;
  }, [categories, rmCategories]);

  const deleteMutation = useAdminDeletePriceList({
    mutation: {
      onSuccess: () => {
        toast({ severity: 'success', message: 'Price list version removed.' });
        setDeleteTarget(null);
        void list.refetch();
      },
      onError: (error) => toast({ severity: 'error', message: errorMessage(error) }),
    },
  });

  const openEdit = (row: PriceListRow) => {
    setViewRow(null);
    setDrawer({ open: true, row });
  };

  return (
    <MastersSectionLayout
      title="Price List"
      count={list.total}
      searchPlaceholder="Search by product or raw material"
      searchValue={list.search}
      onSearch={list.setSearch}
      addLabel="Add price list"
      onAdd={() => setDrawer({ open: true, row: null })}
      extraActions={
        <CustomButton variant="outline" icon={<Upload className="size-4" />} onClick={() => setImportOpen(true)}>
          Import
        </CustomButton>
      }
      searchRowExtras={
        <>
          <div className="w-40">
            <CustomSelect
              name="price-list-kind"
              placeholder="All types"
              value={list.kind}
              items={[
                { value: 'product', label: 'Finished goods' },
                { value: 'raw_material', label: 'Raw materials' },
              ]}
              onChange={(e) => list.setKind(e.target.value)}
              enableDeselect
            />
          </div>
          <div className="w-44">
            <CustomSelect
              name="price-list-category"
              placeholder="All categories"
              value={list.category}
              items={categoryItems}
              onChange={(e) => list.setCategory(e.target.value)}
              enableDeselect
            />
          </div>
        </>
      }
    >
      <PriceListTable
        items={list.items}
        loading={list.isLoading}
        onView={setViewRow}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        onPaginationChange={({ pageIndex, pageSize }) => {
          if (pageSize !== list.pageSize) list.setPageSize(pageSize);
          else list.setPage(pageIndex);
        }}
      />

      <PriceListViewDrawer
        open={viewRow !== null}
        row={viewRow}
        onClose={() => setViewRow(null)}
        onEdit={openEdit}
      />

      <PriceListDrawer
        open={drawer.open}
        row={drawer.open ? drawer.row : null}
        onClose={() => setDrawer({ open: false })}
        onSaved={() => void list.refetch()}
      />

      <PriceListImportDrawer
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => void list.refetch()}
      />

      <ConfirmationPopUp
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate({ priceListId: deleteTarget.id })}
        title="Delete price list version"
        message={
          deleteTarget ? (
            <>
              Delete <span className="font-medium">{deleteTarget.product_name}</span> version{' '}
              <span className="font-medium">v{deleteTarget.version ?? 1}</span>? Other versions of
              this item are kept. This cannot be undone.
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

export default PriceListPage;
