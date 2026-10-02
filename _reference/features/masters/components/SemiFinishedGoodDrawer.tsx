/**
 * Semi-finished good create/edit drawer (client meeting 2 §5): one zod schema
 * for both create and edit modes. Master data only — name + classification +
 * useful attributes. Stock arrives via GRN or SFG↔FG conversion, not here.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { CustomLabel } from '../../../common/custom-label';
import { RHFInput, RHFSelect } from '../../../common/rhf-wrappers';
import { useToast } from '../../../common/common-snackbar';
import { useFormApiErrors } from '../../../hooks/useFormApiErrors';
import { ApiError } from '../../../api/client';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import { normalizeUom, uomItemsWith } from '../../../utils/uom';
import {
  useAdminCreateSemiFinishedGood,
  useAdminUpdateSemiFinishedGood,
  getAdminListSfgCategoriesQueryOptions,
} from '../../../sdk/inventory';
import type { SfgCategoryListItem } from '../../../sdk/schemas';
import { SfgCategoryDrawer } from './sfg-category-drawer';
import type { SemiFinishedGoodRow } from '../api/semi-finished-goods';
import {
  useSemiFinishedGoodForm,
  semiFinishedGoodFormDefaults,
  type SemiFinishedGoodFormValues,
} from '../hooks/useCreateSemiFinishedGoodForm';

// SFG categories are their OWN master (client 2026-07-09) — a separate
// vocabulary from the RM category types. Shared between the options query and
// the inline-add cache append (both must build the SAME query key).
const SFG_CATEGORIES_QUERY = { is_active: true, limit: 100 };

export interface SemiFinishedGoodDrawerProps {
  open: boolean;
  /** Row being edited; null/undefined → create mode. */
  sfg?: SemiFinishedGoodRow | null;
  onClose: () => void;
  /** Fired after save; create passes the new row so callers can auto-select it. */
  onSaved: (item?: SemiFinishedGoodRow) => void;
  /** Create-mode seed (e.g. cross-kind transfer quick-add): name + category name to pre-select. */
  prefill?: { name?: string; category?: string | null; uom?: string };
}

export function SemiFinishedGoodDrawer({ open, sfg, onClose, onSaved, prefill }: SemiFinishedGoodDrawerProps) {
  const { toast } = useToast();
  const isEdit = sfg != null;
  const { control, handleSubmit, reset, setError, setValue } = useSemiFinishedGoodForm(sfg);
  const { handleApiError } = useFormApiErrors(setError);
  const categoriesQuery = useQuery(getAdminListSfgCategoriesQueryOptions(SFG_CATEGORIES_QUERY));
  const categoriesData = categoriesQuery.data;
  const categoryItems = useMemo(() => {
    const results = categoriesData?.status === 200 ? categoriesData.data.results : [];
    return results.map((c) => ({ value: String(c.id), label: c.name }));
  }, [categoriesData]);

  // Inline "add category from the SFG form" (label-row pattern): the saved
  // category is appended to the cached options synchronously and auto-selected.
  const [addingCategory, setAddingCategory] = useState(false);
  const qc = useQueryClient();
  const onCategorySaved = (category?: SfgCategoryListItem) => {
    const categoriesKey = getAdminListSfgCategoriesQueryOptions(SFG_CATEGORIES_QUERY).queryKey;
    if (category) {
      qc.setQueryData(categoriesKey, (prev) => {
        if (prev?.status !== 200) return prev;
        return {
          ...prev,
          data: { ...prev.data, results: [...prev.data.results, category], count: prev.data.count + 1 },
        };
      });
      setValue('sfg_category_id', String(category.id));
    }
    void qc.invalidateQueries({ queryKey: categoriesKey });
  };

  // Re-seed the form when the target row changes (or the drawer re-opens).
  // Create mode may carry a prefill (name + category matched by name).
  // Seed ONCE per open/target: `categoriesData` is a dep only for the prefill
  // name→id match, and it also refreshes when a category is added inline from
  // this form — without the guard that refresh reset the user's typed inputs.
  const seededRef = useRef<string | null>(null);
  useEffect(() => {
    if (!open) {
      seededRef.current = null;
      return;
    }
    // A prefilled create needs the categories loaded for the name match.
    if (sfg == null && prefill && categoriesData == null) return;
    const seedKey = sfg ? `edit-${sfg.id}` : 'create';
    if (seededRef.current === seedKey) return;
    seededRef.current = seedKey;
    const defaults = semiFinishedGoodFormDefaults(sfg);
    if (sfg == null && prefill) {
      const results = categoriesData?.status === 200 ? categoriesData.data.results : [];
      const cat = results.find(
        (c) => c.name.trim().toLowerCase() === (prefill.category ?? '').trim().toLowerCase(),
      );
      reset({
        ...defaults,
        name: prefill.name ?? defaults.name,
        sfg_category_id: cat ? String(cat.id) : defaults.sfg_category_id,
        unit: prefill.uom ? normalizeUom(prefill.uom) : defaults.unit,
      });
      return;
    }
    reset(defaults);
  }, [open, sfg, prefill, categoriesData, reset]);

  const onMutationError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 409) {
      const msg = errorMessage(error);
      // A duplicate (name, category) pair points at the name field; otherwise it's the code.
      setError(/name and category/i.test(msg) ? 'name' : 'code', { type: 'manual', message: msg });
      return;
    }
    const general = handleApiError(error);
    toast({ severity: 'error', message: general ?? errorMessage(error) });
  };

  const createMutation = useAdminCreateSemiFinishedGood({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'Semi-finished good created.') });
        reset(semiFinishedGoodFormDefaults());
        onSaved(response.status === 201 ? response.data : undefined);
        onClose();
      },
      onError: onMutationError,
    },
  });

  const updateMutation = useAdminUpdateSemiFinishedGood({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'Semi-finished good updated.') });
        onSaved();
        onClose();
      },
      onError: onMutationError,
    },
  });

  const handleClose = () => {
    reset(semiFinishedGoodFormDefaults(sfg));
    onClose();
  };

  const onSubmit = (data: SemiFinishedGoodFormValues) => {
    const base = {
      name: data.name,
      code: data.code,
      sfg_category_id: data.sfg_category_id ? Number(data.sfg_category_id) : null,
      unit: data.unit || null,
      reorder_level: data.reorder_level ? Number(data.reorder_level) : null,
      shelf_life_months: data.shelf_life_months ? Number(data.shelf_life_months) : null,
    };
    if (isEdit) updateMutation.mutate({ sfgId: sfg.id, data: base });
    else createMutation.mutate({ data: base });
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <CustomDrawer
      anchor="right"
      title={isEdit ? `Edit semi-finished good` : 'Add semi-finished good'}
      open={open}
      onClose={handleClose}
      drawerWidth="42rem"
      drawerPadding="0px"
    >
      <div className="flex min-h-full flex-col">
        {/* This drawer can stack over a host form (GRN); React bubbles submit
            through portals, so stop it from also submitting the host. */}
        <form
          noValidate
          onSubmit={(e) => {
            e.stopPropagation();
            void handleSubmit(onSubmit)(e);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
            <RHFInput<SemiFinishedGoodFormValues> name="name" control={control} label="Name" required placeholder="Enter name" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RHFInput<SemiFinishedGoodFormValues> name="code" control={control} label="Code" required uppercase placeholder="Enter code" />
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <CustomLabel label="Category" htmlFor="sfg_category_id" />
                  <button
                    type="button"
                    onClick={() => setAddingCategory(true)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    + Add new
                  </button>
                </div>
                <RHFSelect<SemiFinishedGoodFormValues>
                  name="sfg_category_id"
                  control={control}
                  placeholder={categoryItems.length ? 'Select category' : 'No categories yet'}
                  items={categoryItems}
                  enableDeselect
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RHFSelect<SemiFinishedGoodFormValues>
                name="unit"
                control={control}
                label="Unit of measure"
                required
                // Shared CAPS UOM vocabulary (utils/uom — same list as the price
                // list / PO / GRN); a legacy stored unit stays selectable in edit.
                items={uomItemsWith(sfg?.unit)}
                placeholder="Select unit"
                // A material's UOM is the single source of truth downstream (GRN,
                // batches, conversions), so it's fixed after creation — editable only on add.
                isDisabled={isEdit}
              />
              <RHFInput<SemiFinishedGoodFormValues>
                name="reorder_level"
                control={control}
                label="Re-order level"
                required
                isDecimal
                placeholder="e.g. 12.5"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RHFInput<SemiFinishedGoodFormValues>
                name="shelf_life_months"
                control={control}
                label="Shelf life (months)"
                required
                placeholder="e.g. 24"
              />
            </div>
          </div>
          <div className="shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
            <CustomButton type="button" variant="outline" onClick={handleClose}>
              Cancel
            </CustomButton>
            <CustomButton type="submit" variant="primary" loading={saving}>
              {isEdit ? 'Save changes' : 'Add semi-finished good'}
            </CustomButton>
          </div>
        </form>
      </div>

      {/* Inline SFG-category creation without leaving the SFG form. */}
      <SfgCategoryDrawer
        open={addingCategory}
        onClose={() => setAddingCategory(false)}
        onSaved={onCategorySaved}
      />
    </CustomDrawer>
  );
}
