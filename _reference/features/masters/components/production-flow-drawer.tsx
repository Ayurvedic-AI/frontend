import { useEffect } from 'react';
import { useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { CustomLabel } from '../../../common/custom-label';
import { useToast } from '../../../common/common-snackbar';
import { RHFInput } from '../../../common/rhf-wrappers';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import {
  useAdminCreateProductionFlow,
  useAdminUpdateProductionFlow,
} from '../../../sdk/inventory';
import type { ProductionFlowItem } from '../../../sdk/schemas';
import {
  emptyFlowStep,
  isRmStepLabel,
  productionFlowFormDefaults,
  useProductionFlowForm,
  type ProductionFlowFormValues,
} from '../hooks/use-production-flow-form';

interface Props {
  open: boolean;
  /** null = create; a row = edit. */
  flow: ProductionFlowItem | null;
  onClose: () => void;
  /** Called after a successful save with the saved flow (when the API returned it). */
  onSaved: (saved?: ProductionFlowItem) => void;
}

/**
 * Add/edit a Production Flow (072 dynamic flows): name + the ordered step
 * list. Steps are fully free — none are required. A
 * step named "Raw Material Issue" (or "RM Issue") deducts the reserved raw material when completed;
 * flows without one deduct at Finished Goods posting.
 */
export function ProductionFlowDrawer({ open, flow, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const isEdit = flow !== null;
  const { control, handleSubmit, reset, watch } = useProductionFlowForm(flow);
  const { fields, append, remove } = useFieldArray({ control, name: 'steps' });
  const watchedSteps = watch('steps');

  useEffect(() => {
    if (open) reset(productionFlowFormDefaults(flow));
  }, [open, flow, reset]);

  const createMutation = useAdminCreateProductionFlow({
    mutation: {
      onSuccess: (r) => {
        toast({ severity: 'success', message: successMessage(r, 'Production flow created.') });
        onSaved(r.status === 201 ? r.data : undefined);
        onClose();
      },
      onError: (e) => toast({ severity: 'error', message: errorMessage(e) }),
    },
  });
  const updateMutation = useAdminUpdateProductionFlow({
    mutation: {
      onSuccess: (r) => {
        toast({ severity: 'success', message: successMessage(r, 'Production flow updated.') });
        onSaved(r.status === 200 ? r.data : undefined);
        onClose();
      },
      onError: (e) => toast({ severity: 'error', message: errorMessage(e) }),
    },
  });
  const pending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: ProductionFlowFormValues) => {
    // testing_label is no longer edited here — create uses the backend default
    // ("Testing") and update leaves the stored value untouched by omitting it.
    // Step names are stored UPPERCASE (also normalises legacy lowercase rows on edit).
    const body = {
      name: data.name,
      steps: data.steps.map((s) => ({ label: s.label.trim().toUpperCase() })),
    };
    if (isEdit) updateMutation.mutate({ flowId: flow.id, data: body });
    else createMutation.mutate({ data: body });
  };

  return (
    <CustomDrawer
      anchor="right"
      title={isEdit ? `Edit flow — ${flow.name}` : 'Add production flow'}
      open={open}
      onClose={onClose}
      drawerWidth="42rem"
      drawerPadding="0px"
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex min-h-full flex-col">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <CustomLabel label="Flow name" htmlFor="name" isRequired />
            <RHFInput name="name" control={control} placeholder="e.g. Syrup, Avaleha" />
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Production steps
              </p>
              <CustomButton
                type="button"
                variant="outline"
                size="sm"
                icon={<Plus className="size-4" />}
                onClick={() => append(emptyFlowStep())}
              >
                Add step
              </CustomButton>
            </div>
            {fields.length === 0 && (
              <p className="mb-1.5 text-sm text-muted-foreground">
                No steps — the batch can move straight to testing. Add a “RAW MATERIAL ISSUE” step
                if raw material should be deducted during production (otherwise it is deducted when
                the batch is finished).
              </p>
            )}
            <div className="flex flex-col gap-2">
              {fields.map((field, index) => {
                // The raw-material first step is fixed: it deducts the reserved
                // raw material, so it can be neither renamed nor removed.
                const locked = index === 0 && isRmStepLabel(watchedSteps?.[0]?.label ?? '');
                return (
                  <div key={field.id} className="flex items-start gap-2">
                    <span className="mt-2 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <RHFInput
                        name={`steps.${index}.label`}
                        control={control}
                        uppercase
                        disableField={locked}
                        placeholder={`STEP ${index + 1} NAME`}
                      />
                      {locked && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Fixed step — completing it deducts the reserved raw material.
                        </p>
                      )}
                    </div>
                    {!locked && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        aria-label="Remove step"
                        className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {isEdit && (
              <p className="mt-2 text-xs text-muted-foreground">
                Changing steps affects batches sent to production from now on — running batches keep
                the steps they started with.
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
          <CustomButton type="button" variant="outline" onClick={onClose} size="md">
            Cancel
          </CustomButton>
          <CustomButton type="submit" variant="primary" size="md" disabled={pending} loading={pending}>
            {isEdit ? 'Save changes' : 'Create flow'}
          </CustomButton>
        </div>
      </form>
    </CustomDrawer>
  );
}

export default ProductionFlowDrawer;
