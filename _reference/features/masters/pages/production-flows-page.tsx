import { useMemo, useState } from 'react';
import { ConfirmationPopUp } from '../../../common/confirmation-pop-up';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage } from '../../../utils/api-messages';
import { useAdminDeleteProductionFlow } from '../../../sdk/inventory';
import { useProductionFlows } from '../hooks/use-production-flows';
import { MastersSectionLayout } from '../components/masters-section-layout';
import { ProductionFlowsTable } from '../components/production-flows-table';
import { ProductionFlowDrawer } from '../components/production-flow-drawer';
import { ProductionFlowViewDrawer } from '../components/production-flow-view-drawer';
import type { ProductionFlowItem } from '../../../sdk/schemas';

type DrawerState = { open: false } | { open: true; flow: ProductionFlowItem | null };

/**
 * Masters → Production Flows (072 dynamic flows). Each flow defines the
 * PRODUCTION-stage step checklist for the BOM templates that use it; steps
 * are fully free (may be empty).
 */
export function ProductionFlowsPage() {
  const { toast } = useToast();
  const [drawer, setDrawer] = useState<DrawerState>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<ProductionFlowItem | null>(null);
  const [viewTarget, setViewTarget] = useState<ProductionFlowItem | null>(null);
  const [q, setQ] = useState('');

  const { flows, count, isLoading, refetch } = useProductionFlows();
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return flows;
    return flows.filter(
      (f) =>
        f.name.toLowerCase().includes(needle) ||
        f.steps.some((s) => s.label.toLowerCase().includes(needle)),
    );
  }, [flows, q]);

  const deleteMutation = useAdminDeleteProductionFlow({
    mutation: {
      onSuccess: () => {
        toast({ severity: 'success', message: 'Production flow deleted.' });
        setDeleteTarget(null);
        void refetch();
      },
      onError: (error) => toast({ severity: 'error', message: errorMessage(error) }),
    },
  });

  return (
    <MastersSectionLayout
      title="Production Flows"
      backTo="/masters/boms"
      backLabel="BOMs"
      count={count}
      searchPlaceholder="Search by flow or step"
      searchValue={q}
      onSearch={setQ}
      addLabel="Add flow"
      onAdd={() => setDrawer({ open: true, flow: null })}
    >
      <ProductionFlowsTable
        flows={visible}
        loading={isLoading}
        onView={setViewTarget}
        onEdit={(flow) => setDrawer({ open: true, flow })}
        onDelete={setDeleteTarget}
      />

      <ProductionFlowViewDrawer
        open={viewTarget !== null}
        flow={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={(flow) => {
          setViewTarget(null);
          setDrawer({ open: true, flow });
        }}
      />

      <ProductionFlowDrawer
        open={drawer.open}
        flow={drawer.open ? drawer.flow : null}
        onClose={() => setDrawer({ open: false })}
        onSaved={() => void refetch()}
      />

      <ConfirmationPopUp
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate({ flowId: deleteTarget.id })}
        title="Delete production flow"
        message={
          deleteTarget ? (
            <>
              Delete <span className="font-medium">{deleteTarget.name}</span>? Flows used by BOM
              templates cannot be deleted — repoint those templates first.
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

export default ProductionFlowsPage;
