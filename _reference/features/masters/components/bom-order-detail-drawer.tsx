/**
 * BOM Order read-only detail drawer.
 * Shows the full order record — identity hero, progress timeline, ingredient
 * lines, and the reserved-stock allocations (feature 067) — in the app's
 * card language. Read-only: all data comes from the list row (BomOrderOut),
 * so no extra fetch, mutation, or form is involved. The allocations table is
 * the shared BomOrderAllocationsPanel (also used by the Manufacturing drawer).
 */
import { useState, type ReactNode } from 'react';
import { FlaskConical } from 'lucide-react';
import { CustomButton } from '../../../common/custom-buttons';
import { CustomDrawer } from '../../../common/custom-drawer';
import { ConfirmationPopUp } from '../../../common/confirmation-pop-up';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import { PermissionButton } from '../../auth/permissions';
import { useAdminRevertProductionCompletion } from '../../../sdk/production';
import { cn } from '../../../lib/cn';
import { formatDate } from '../../../utils/format';
import { pipelineStageName, type BomOrderRow } from '../api/bom-orders';
import { StatusBadge } from './BomOrdersTable';
import { BomOrderAllocationsPanel, fmtQty } from './bom-order-allocations-panel';
import { useMaterialCategoryByName, useRmCategoryMap } from '../hooks/use-rm-category-map';
import { MediaDocumentsPanel } from '../../../common/media-upload';
import { useProductionItem } from '../../production-pipeline/hooks/useProductionQueue';
import { ProductionStepsPanel } from '../../production-pipeline/components/production-steps-panel';
import { formatDateTime, formatQty } from '../../../utils/format';

function Meta({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('font-medium text-foreground', mono && 'font-mono text-sm')}>{children}</dd>
    </div>
  );
}

const JOURNEY_STAGES = [
  { key: 'PRODUCTION', label: 'Production' },
  { key: 'TESTING', label: 'Testing' },
  { key: 'PACKING', label: 'Packing' },
  { key: 'FINISHED_GOODS', label: 'Finished Goods' },
] as const;

/** Production journey stepper: which macro stages the batch went through —
 *  shown for in-progress, COMPLETED and CANCELLED runs alike. */
function PipelineJourney({ stage, status }: { stage: string; status?: string | null }) {
  const stageIdx = JOURNEY_STAGES.findIndex((s) => s.key === stage);
  return (
    <ol className="flex flex-wrap items-center gap-y-2">
      {JOURNEY_STAGES.map((s, i) => {
        const state =
          i < stageIdx || (i === stageIdx && status === 'COMPLETED')
            ? 'done'
            : i === stageIdx
              ? status === 'CANCELLED'
                ? 'cancelled'
                : 'current'
              : 'pending';
        return (
          <li key={s.key} className="flex items-center">
            {i > 0 && (
              <span
                aria-hidden
                className={cn('mx-2 h-px w-6 sm:w-10', state === 'pending' ? 'bg-border' : 'bg-primary/50')}
              />
            )}
            <span className="flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                  state === 'done' && 'bg-emerald-100 text-emerald-700',
                  state === 'current' && 'bg-blue-100 text-blue-700',
                  state === 'cancelled' && 'bg-red-100 text-red-700',
                  state === 'pending' && 'bg-secondary text-muted-foreground',
                )}
              >
                {state === 'done' ? '✓' : state === 'cancelled' ? '✕' : i + 1}
              </span>
              <span
                className={cn(
                  'text-xs font-medium',
                  state === 'pending' ? 'text-muted-foreground' : 'text-foreground',
                )}
              >
                {s.label}
                {state === 'cancelled' && <span className="ml-1 text-red-600">(cancelled)</span>}
                {state === 'current' && <span className="ml-1 text-blue-600">(current)</span>}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function SectionCard({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border bg-secondary/40 px-3 py-2">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

interface BomOrderDetailDrawerProps {
  order: BomOrderRow | null;
  onClose: () => void;
  onCreateOrder: (order: BomOrderRow) => void;
  onSendToProduction: (order: BomOrderRow) => void;
  /** Called after an accidental completion is reverted, so the list refetches. */
  onReverted?: () => void;
  actionPending?: boolean;
}

export function BomOrderDetailDrawer({
  order,
  onClose,
  onCreateOrder,
  onSendToProduction,
  onReverted,
  actionPending,
}: BomOrderDetailDrawerProps) {
  const { toast } = useToast();
  const [confirmRevert, setConfirmRevert] = useState(false);
  const lines = order?.lines ?? [];
  const inPipeline = order?.pipeline?.exists === true;
  // material_code → category chip data for the Allocated stock panel (076).
  const categoryByCode = useRmCategoryMap(order !== null);
  // Snapshot lines carry no material link, so ingredient categories resolve by
  // name — same lookup the create/edit drawer's preview uses.
  const categoryByName = useMaterialCategoryByName(order !== null);
  // Full production-run detail (steps / testing / packaging / history) for the
  // journey section — fetched via the indicator's item_uuid (also for
  // cancelled/completed runs).
  const { item: runDetail } = useProductionItem(
    order?.pipeline?.item_uuid ? String(order.pipeline.item_uuid) : undefined,
  );
  // DRAFT → Create Order (confirms + reserves stock); CONFIRMED (not yet in
  // production) → Send to Production. Later stages are read-only.
  const primaryAction =
    order?.status === 'DRAFT'
      ? { label: 'Create Order', onClick: () => onCreateOrder(order) }
      : order?.status === 'CONFIRMED' && !inPipeline
        ? { label: 'Send to Production', onClick: () => onSendToProduction(order) }
        : null;

  // Accidental-posting escape hatch: a COMPLETED run can be reverted while the
  // posted FG stock is untouched (the backend verifies and 422s otherwise).
  const revertMutation = useAdminRevertProductionCompletion({
    mutation: {
      onSuccess: (response) => {
        toast({
          severity: 'success',
          message: successMessage(response, 'Completion reverted — batch is back in Packing.'),
        });
        setConfirmRevert(false);
        onReverted?.();
        onClose();
      },
      onError: (error) => toast({ severity: 'error', message: errorMessage(error) }),
    },
  });
  const canRevert =
    order?.status === 'COMPLETED' &&
    order.pipeline?.status === 'COMPLETED' &&
    order.pipeline.item_uuid != null;

  return (
    <CustomDrawer
      anchor="right"
      title="BOM Order"
      open={order !== null}
      onClose={onClose}
      drawerWidth="48rem"
      drawerPadding="0px"
    >
      {order && (
        <div className="flex min-h-full flex-col">
        <div className="flex flex-1 flex-col gap-3 px-6 py-5 text-sm">
          {/* Order hero — what's being made, from which recipe, current state. */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FlaskConical className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-foreground">
                  {order.bom_name ?? `Template #${order.bom_id}`}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Batch <span className="font-mono">{order.batch_no}</span>
                  {order.batch_size != null ? ` · Batch size ${fmtQty(String(order.batch_size))}` : ''} ·{' '}
                  {order.line_count} {order.line_count === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
            <span className="flex shrink-0 flex-wrap items-center gap-2">
              <StatusBadge status={order.status} />
              {order.pipeline?.exists ? (
                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                  In {pipelineStageName(order.pipeline.stage)}
                </span>
              ) : order.pipeline?.status === 'CANCELLED' ? (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">
                  Production cancelled in {pipelineStageName(order.pipeline.stage)}
                </span>
              ) : null}
            </span>
          </div>

          {/* Cancelled reason — surfaced first so it's never missed. */}
          {order.status === 'CANCELLED' && order.cancel_reason ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              <span className="font-medium">Cancelled:</span> {order.cancel_reason}
            </p>
          ) : order.pipeline?.status === 'CANCELLED' && runDetail?.cancel_reason ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              <span className="font-medium">Production run cancelled:</span> {runDetail.cancel_reason}
            </p>
          ) : null}

          {/* Key dates + progress */}
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details</p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              <Meta label="Mfg date">{formatDate(order.mfg_date)}</Meta>
              <Meta label="Exp date">{formatDate(order.exp_date)}</Meta>
              <Meta label="Created">{formatDate(order.created_at)}</Meta>
              <Meta label="Started production">{formatDate(order.started_at)}</Meta>
              <Meta label="Completed">{formatDate(order.completed_at)}</Meta>
              <Meta label="Batch no." mono>{order.batch_no}</Meta>
            </dl>
          </div>

          {/* Production journey — visible for in-progress, completed AND
              cancelled runs (the pipeline indicator keeps the last run). */}
          {order.pipeline?.stage ? (
            <SectionCard
              title="Production journey"
              hint={
                order.pipeline.status === 'CANCELLED'
                  ? 'This run was cancelled'
                  : order.pipeline.status === 'COMPLETED'
                    ? 'Run completed'
                    : 'Run in progress'
              }
            >
              <div className="flex flex-col gap-3 p-3">
                <div className="overflow-x-auto">
                  <PipelineJourney stage={order.pipeline.stage} status={order.pipeline.status} />
                </div>

                {runDetail && (
                  <>
                    {/* Production steps (072) */}
                    {(runDetail.steps?.length ?? 0) > 0 && (
                      <ProductionStepsPanel steps={runDetail.steps ?? []} />
                    )}

                    {/* Testing details */}
                    <div className="rounded-lg border border-border">
                      <p className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {runDetail.testing_label ?? 'Testing'}
                      </p>
                      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 p-3 text-sm sm:grid-cols-3">
                        <Meta label="Test date">
                          {runDetail.test_date ? formatDateTime(runDetail.test_date) : '—'}
                        </Meta>
                        <Meta label="Documents">{String(runDetail.document_count ?? 0)}</Meta>
                        <div className="col-span-2 sm:col-span-1">
                          <dt className="text-xs text-muted-foreground">Notes</dt>
                          <dd className="whitespace-pre-wrap font-medium text-foreground">
                            {runDetail.test_notes || '—'}
                          </dd>
                        </div>
                      </dl>
                      {/* Uploaded test documents — read-only (download only). */}
                      {(runDetail.document_count ?? 0) > 0 && (
                        <div className="border-t border-border p-3">
                          <MediaDocumentsPanel
                            owner={{ ownerType: 'production_pipeline_item', ownerId: runDetail.id }}
                            readOnly
                          />
                        </div>
                      )}
                    </div>

                    {/* Packaging / completion */}
                    {runDetail.actual_output_qty != null && (
                      <div className="rounded-lg border border-border">
                        <p className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Packaging &amp; output
                        </p>
                        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 p-3 text-sm sm:grid-cols-3">
                          <Meta label="Actual output">
                            {`${formatQty(runDetail.actual_output_qty)}${runDetail.unit ? ` ${runDetail.unit}` : ''}`}
                          </Meta>
                          <Meta label="Output batch" mono>
                            {runDetail.output_batch_no || '—'}
                          </Meta>
                        </dl>
                        {runDetail.output_lines && runDetail.output_lines.length > 0 && (
                          <ul className="divide-y divide-border border-t border-border">
                            {runDetail.output_lines.map((line) => (
                              <li
                                key={line.id}
                                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                              >
                                <span className="text-foreground">
                                  {line.package_uom}
                                  <span className="text-muted-foreground">
                                    {' '}
                                    · {formatQty(line.pack_qty)} {line.pack_unit} each
                                  </span>
                                </span>
                                <span className="whitespace-nowrap font-medium text-foreground">
                                  × {line.count}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* History timeline */}
                    {runDetail.history && runDetail.history.length > 0 && (
                      <div className="rounded-lg border border-border">
                        <p className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          History
                        </p>
                        <ul className="divide-y divide-border">
                          {runDetail.history.map((h, i) => (
                            <li
                              key={`${h.at}-${i}`}
                              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                            >
                              <span className="text-foreground">
                                {h.action}
                                {h.actor_name ? (
                                  <span className="text-muted-foreground"> · {h.actor_name}</span>
                                ) : null}
                              </span>
                              <span className="whitespace-nowrap text-xs text-muted-foreground">
                                {formatDateTime(h.at)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </SectionCard>
          ) : null}

          {/* Ingredient lines */}
          <SectionCard
            title="Ingredient lines"
            hint={`${order.line_count} ${order.line_count === 1 ? 'line' : 'lines'}`}
          >
            {lines.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Material</th>
                      <th className="px-3 py-2 text-right font-medium">Quantity</th>
                      <th className="px-3 py-2 font-medium">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr
                        key={line.id}
                        className={cn(
                          'border-t border-border',
                          line.section === 'SECTION_HEADER' && 'bg-muted/40 font-semibold',
                        )}
                      >
                        <td className="px-3 py-2 text-foreground">
                          <span className="align-middle">{line.ingredient_name || '—'}</span>
                          {line.section !== 'SECTION_HEADER' && (
                            <>
                              {categoryByName.get(
                                (line.ingredient_name ?? '').trim().toLowerCase(),
                              ) && (
                                <span className="ml-1.5 inline-block whitespace-nowrap rounded-full bg-secondary px-1.5 py-px align-middle text-[10px] font-medium text-muted-foreground">
                                  {categoryByName.get(
                                    (line.ingredient_name ?? '').trim().toLowerCase(),
                                  )}
                                </span>
                              )}
                              {/* Free-text "other ingredients" link to no material,
                                  so nothing is reserved or checked for them. */}
                              {(line.section === 'INGREDIENT_SCALED' ||
                                line.section === 'INGREDIENT_FIXED') && (
                                <span
                                  title="Free-text ingredient — not linked to a stock item, so no quantity is reserved or checked"
                                  className="ml-1.5 inline-block whitespace-nowrap rounded-full bg-info-05 px-1.5 py-px align-middle text-[10px] font-medium text-info-60"
                                >
                                  Untracked ingredient
                                </span>
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">
                          {line.section === 'SECTION_HEADER' ? '' : fmtQty(line.quantity)}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{line.unit || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                No ingredient lines on this order.
              </p>
            )}
          </SectionCard>

          {/* Allocated stock (shared panel) — RELEASED rows from an earlier
              cancelled run are hidden, else re-reserved stock lists twice. */}
          <SectionCard title="Allocated stock" hint="Raw material reserved for this order">
            <div className="p-3">
              <BomOrderAllocationsPanel
                allocations={(order.allocations ?? []).filter((a) => a.status !== 'RELEASED')}
                categoryByCode={categoryByCode}
              />
            </div>
          </SectionCard>
        </div>

        {/* Pinned action bar — always visible while the content scrolls. */}
        <div className="sticky bottom-0 shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
          <CustomButton type="button" variant="outline" onClick={onClose}>
            Close
          </CustomButton>
          {canRevert && (
            <PermissionButton
              permission="production.delete"
              type="button"
              variant="destructive"
              loading={revertMutation.isPending}
              onClick={() => setConfirmRevert(true)}
            >
              Revert completion
            </PermissionButton>
          )}
          {primaryAction && (
            <CustomButton type="button" loading={actionPending} onClick={primaryAction.onClick}>
              {primaryAction.label}
            </CustomButton>
          )}
        </div>
        </div>
      )}

      {confirmRevert && order?.pipeline?.item_uuid != null && (
        <ConfirmationPopUp
          open
          title="Revert this completion?"
          message={
            `Undo the finished-goods posting for batch "${order.batch_no}"? The posted stock ` +
            'is removed, the consumed raw material returns to stock (re-reserved for this ' +
            'order), and the batch goes back to Packing so it can be completed again with ' +
            'the correct figures. Only possible while the posted stock is untouched.'
          }
          confirmLabel="Revert completion"
          destructive
          onConfirm={() =>
            revertMutation.mutate({ itemUuid: String(order.pipeline!.item_uuid) })
          }
          onClose={() => setConfirmRevert(false)}
          confirmDisabled={revertMutation.isPending}
        />
      )}
    </CustomDrawer>
  );
}
