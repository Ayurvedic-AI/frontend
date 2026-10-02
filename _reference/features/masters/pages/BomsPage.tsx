/**
 * BOMs page — feature 037.
 * Two underline tabs: "BOM Templates" (recipe CRUD) and "BOM Orders" (batch records).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmationPopUp } from '../../../common/confirmation-pop-up';
import { CustomSelect } from '../../../common/custom-select';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage } from '../../../utils/api-messages';
import { useAdminSetBomStatus, useAdminDeleteBom, useAdminDeleteBomOrder } from '../../../sdk/inventory';
import { useAdminCreateProductionItem } from '../../../sdk/production';
import { useAdminSetBomOrderStatus } from '../../../sdk/inventory';
import { useBoms } from '../hooks/useBoms';
import { useBomOrders } from '../hooks/useBomOrders';
import { useMastersListState } from '../hooks/use-masters-list-state';
import { MastersSectionLayout } from '../components/masters-section-layout';
import { BomsTable } from '../components/BomsTable';
import { BomOrdersTable } from '../components/BomOrdersTable';
import { BomDrawer } from '../components/BomDrawer';
import { BomDetailDrawer } from '../components/BomDetailDrawer';
import { BomImportDrawer } from '../components/BomImportDrawer';
import { BomOrderDrawer } from '../components/BomOrderDrawer';
import { BomOrderDetailDrawer } from '../components/bom-order-detail-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { exportBomCsv } from '../api/boms';
import { cn } from '../../../lib/cn';
import type { BomRow } from '../api/boms';
import type { BomOrderRow } from '../api/bom-orders';

const SORTABLE = ['name', 'code', 'created_at', 'is_active'] as const;
type Tab = 'templates' | 'orders';

type TemplateDrawer =
  | { open: false }
  | { open: true; bom: BomRow | null; seedFrom?: BomRow | null; seedName?: string };

/** Strip a trailing " (vN)" version tag from a BOM name. */
const stripVersionTag = (name: string) => name.replace(/\s*\(v\d+\)\s*$/i, '').trim();
/** Parse the version number from a name's trailing " (vN)" (1 when untagged). */
const parseVersionTag = (name: string) => {
  const m = name.match(/\(v(\d+)\)\s*$/i);
  return m ? Number(m[1]) : 1;
};

type OrderDrawer =
  | { open: false }
  | { open: true; order: BomOrderRow | null };

export function BomsPage() {
  const { toast } = useToast();
  // BOM Orders is the first tab and the default landing view (the Masters
  // "BOMs" card opens here); BOM Templates is the second tab.
  const [activeTab, setActiveTab] = useState<Tab>('orders');

  // Template tab state
  const list = useMastersListState(SORTABLE);
  const [drawer, setDrawer] = useState<TemplateDrawer>({ open: false });
  const [statusTarget, setStatusTarget] = useState<BomRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BomRow | null>(null);
  const [selected, setSelected] = useState<BomRow | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const navigate = useNavigate();

  // Order tab state — namespaced so its search/page/sort don't share the URL
  // query string with the Templates tab above (which would filter freshly
  // created orders out of view).
  const orderList = useMastersListState(SORTABLE, 'orders');
  const [orderDrawer, setOrderDrawer] = useState<OrderDrawer>({ open: false });
  const [viewOrder, setViewOrder] = useState<BomOrderRow | null>(null);
  const [deleteOrderTarget, setDeleteOrderTarget] = useState<BomOrderRow | null>(null);

  // Output-kind filter (finished vs semi-finished templates) — server-side.
  const [templateKind, setTemplateKind] = useState('');

  const { boms, count, isLoading, refetch } = useBoms(
    {
      search: list.q,
      page: list.page,
      pageSize: list.pageSize,
      sort: list.sort,
      activeOnly: list.activeOnly,
    },
    { kind: (templateKind || undefined) as 'product' | 'sfg' | undefined },
  );

  const { orders, count: ordersCount, isLoading: ordersLoading, refetch: refetchOrders } = useBomOrders({
    search: orderList.q,
    page: orderList.page,
    pageSize: orderList.pageSize,
    sort: orderList.sort,
    status: undefined,
  });

  const statusMutation = useAdminSetBomStatus({
    mutation: {
      onSuccess: () => {
        toast({ severity: 'success', message: 'BOM status updated.' });
        setStatusTarget(null);
        void refetch();
      },
      onError: (error) => toast({ severity: 'error', message: errorMessage(error) }),
    },
  });

  const deleteMutation = useAdminDeleteBom({
    mutation: {
      onSuccess: () => {
        toast({ severity: 'success', message: 'BOM template deleted.' });
        setDeleteTarget(null);
        void refetch();
      },
      onError: (error) => {
        toast({ severity: 'error', message: errorMessage(error) });
        setDeleteTarget(null);
      },
    },
  });

  const deleteOrderMutation = useAdminDeleteBomOrder({
    mutation: {
      onSuccess: () => {
        toast({ severity: 'success', message: 'BOM order deleted.' });
        setDeleteOrderTarget(null);
        void refetchOrders();
      },
      onError: (error) => {
        toast({ severity: 'error', message: errorMessage(error) });
        setDeleteOrderTarget(null);
      },
    },
  });

  const sendToProductionMutation = useAdminCreateProductionItem({
    mutation: {
      onSuccess: () => {
        toast({ severity: 'success', message: 'Sent to manufacturing.' });
        void refetchOrders();
      },
      onError: (error) => toast({ severity: 'error', message: errorMessage(error) }),
    },
  });

  // "Create Order" confirms a DRAFT — that is what performs the raw-material
  // reservation. If it fails (short raw material, the usual case) the API's
  // shortage message surfaces and the order stays a draft. Sending to
  // production is a separate, CONFIRMED-only action.
  const confirmOrderMutation = useAdminSetBomOrderStatus({
    mutation: {
      onSuccess: () => {
        toast({ severity: 'success', message: 'Order created — stock reserved.' });
        setViewOrder(null);
        void refetchOrders();
      },
      onError: (error) => toast({ severity: 'error', message: errorMessage(error) }),
    },
  });

  const createOrder = (order: BomOrderRow) => {
    confirmOrderMutation.mutate(
      {
        orderUuid: order.uuid as string,
        data: { status: 'CONFIRMED' },
      },
      {
        // Insufficient stock (the usual failure): the toast alone doesn't say
        // WHICH material is short, so open the edit drawer — its feasibility
        // panel lists the per-material need-vs-have shortfalls.
        onError: () => {
          setViewOrder(null);
          setOrderDrawer({ open: true, order });
        },
      },
    );
  };

  const sendOrderToProduction = (order: BomOrderRow) => {
    setViewOrder(null);
    sendToProductionMutation.mutate({ data: { bom_order_uuid: order.uuid as string } });
  };

  const handleExportCsv = async (bom: BomRow) => {
    try {
      await exportBomCsv(bom.id, `${bom.code}-bom.csv`);
    } catch (err) {
      toast({ severity: 'error', message: errorMessage(err) });
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'orders', label: 'BOM Orders' },
    { key: 'templates', label: 'BOM Templates' },
  ];

  return (
    <>
      {/* Tab navigation */}
      <div className="border-b border-border px-4 pt-2 sm:px-6">
        <nav className="-mb-px flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              aria-current={activeTab === t.key ? 'page' : undefined}
              className={cn(
                'border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none',
                activeTab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* BOM Templates tab */}
      {activeTab === 'templates' && (
        <MastersSectionLayout
          title="BOM Templates"
          // description=""
          count={count}
          searchPlaceholder="Search by product name"
          searchValue={list.q}
          onSearch={list.setSearch}
          addLabel="Add Template"
          onAdd={() => setDrawer({ open: true, bom: null })}
          activeOnly={list.activeOnly}
          onActiveOnlyChange={list.setActiveOnly}
          searchRowExtras={
            <div className="w-44">
              <CustomSelect
                name="bom-template-kind"
                placeholder="All types"
                value={templateKind}
                items={[
                  { value: 'product', label: 'Finished goods' },
                  { value: 'sfg', label: 'Semi-finished goods' },
                ]}
                onChange={(e) => {
                  setTemplateKind(e.target.value);
                  list.setPagination({ pageIndex: 0, pageSize: list.pageSize });
                }}
                enableDeselect
              />
            </div>
          }
          extraActions={
            <>
              <CustomButton variant="outline" type="button" onClick={() => navigate('/masters/production-flows')}>
                Production flows
              </CustomButton>
              <CustomButton variant="outline" type="button" onClick={() => setImportOpen(true)}>
                Import CSV / Excel
              </CustomButton>
            </>
          }
        >
          <BomsTable
            boms={boms}
            loading={isLoading}
            rowCount={count}
            pageIndex={list.page}
            pageSize={list.pageSize}
            sorting={list.sorting}
            onPaginationChange={list.setPagination}
            onSortingChange={list.setSorting}
            onRowClick={setSelected}
            onEdit={(bom) => setDrawer({ open: true, bom })}
            onDuplicate={(bom) => {
              const base = stripVersionTag(bom.name);
              const nextV =
                boms
                  .filter((b) => stripVersionTag(b.name) === base)
                  .reduce((mx, b) => Math.max(mx, parseVersionTag(b.name)), 1) + 1;
              setDrawer({ open: true, bom: null, seedFrom: bom, seedName: `${base} (v${nextV})` });
            }}
            onToggleStatus={setStatusTarget}
            onDelete={setDeleteTarget}
            onExportCsv={handleExportCsv}
          />
        </MastersSectionLayout>
      )}

      {/* BOM Orders tab */}
      {activeTab === 'orders' && (
        <MastersSectionLayout
          title="BOM Orders"
          // description=""
          count={ordersCount}
          searchPlaceholder="Search by batch no or product"
          searchValue={orderList.q}
          onSearch={orderList.setSearch}
          addLabel="Create BOM Order"
          onAdd={() => setOrderDrawer({ open: true, order: null })}
        >
          <BomOrdersTable
            orders={orders}
            loading={ordersLoading}
            rowCount={ordersCount}
            pageIndex={orderList.page}
            pageSize={orderList.pageSize}
            sorting={orderList.sorting}
            onPaginationChange={orderList.setPagination}
            onSortingChange={orderList.setSorting}
            onView={setViewOrder}
            onEdit={(order) => setOrderDrawer({ open: true, order })}
            onDelete={setDeleteOrderTarget}
            onCreateOrder={createOrder}
            onSendToProduction={sendOrderToProduction}
          />
        </MastersSectionLayout>
      )}

      {/* Template drawers / dialogs */}
      <BomDrawer
        open={drawer.open}
        bom={drawer.open ? drawer.bom : null}
        seedFrom={drawer.open ? drawer.seedFrom ?? null : null}
        seedName={drawer.open ? drawer.seedName : undefined}
        onClose={() => setDrawer({ open: false })}
        onSaved={() => void refetch()}
      />
      <BomDetailDrawer
        bom={selected}
        onClose={() => setSelected(null)}
        onEdit={(bom) => {
          setSelected(null);
          setDrawer({ open: true, bom });
        }}
      />
      <BomImportDrawer
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => void refetch()}
      />

      {/* Status toggle */}
      {statusTarget && (
        <ConfirmationPopUp
          open
          title={statusTarget.is_active ? 'Deactivate BOM?' : 'Activate BOM?'}
          message={`${statusTarget.is_active ? 'Deactivate' : 'Activate'} "${statusTarget.name}"?`}
          onConfirm={() =>
            statusMutation.mutate({
              bomId: statusTarget.id,
              data: { is_active: !statusTarget.is_active },
            })
          }
          onClose={() => setStatusTarget(null)}
          confirmDisabled={statusMutation.isPending}
        />
      )}

      {/* Delete template */}
      {deleteTarget && (
        <ConfirmationPopUp
          open
          title="Delete BOM Template?"
          message={`Delete "${deleteTarget.name}"? Orders linked to this template will block deletion.`}
          confirmLabel="Delete"
          destructive
          onConfirm={() => deleteMutation.mutate({ bomId: deleteTarget.id })}
          onClose={() => setDeleteTarget(null)}
          confirmDisabled={deleteMutation.isPending}
        />
      )}

      {/* BOM Order drawer */}
      <BomOrderDrawer
        open={orderDrawer.open}
        order={orderDrawer.open ? orderDrawer.order : null}
        onClose={() => setOrderDrawer({ open: false })}
        onSaved={() => void refetchOrders()}
      />

      {/* BOM Order read-only detail drawer */}
      <BomOrderDetailDrawer
        order={viewOrder}
        onClose={() => setViewOrder(null)}
        onCreateOrder={createOrder}
        onSendToProduction={sendOrderToProduction}
        onReverted={() => void refetchOrders()}
        actionPending={confirmOrderMutation.isPending || sendToProductionMutation.isPending}
      />

      {/* Delete order */}
      {deleteOrderTarget && (
        <ConfirmationPopUp
          open
          title="Delete BOM Order?"
          message={`Delete order "${deleteOrderTarget.batch_no}"? This cannot be undone.`}
          confirmLabel="Delete"
          destructive
          onConfirm={() =>
            deleteOrderMutation.mutate({ orderUuid: deleteOrderTarget.uuid as string })
          }
          onClose={() => setDeleteOrderTarget(null)}
          confirmDisabled={deleteOrderMutation.isPending}
        />
      )}
    </>
  );
}
