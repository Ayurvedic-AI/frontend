/**
 * Raw material create/edit drawer (feature 027 + 061; 065): one zod schema for
 * both create and edit modes. Master data only — name + classification + useful
 * attributes. Stock, vendor and AR references are captured at goods receipt
 * (GRN), not here.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { CustomLabel } from '../../../common/custom-label';
import { RHFInput, RHFSelect } from '../../../common/rhf-wrappers';
import { useToast } from '../../../common/common-snackbar';
import { useFormApiErrors } from '../../../hooks/useFormApiErrors';
import { ApiError } from '../../../api/client';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import { normalizeUom, uomItemsWith } from '../../../utils/uom';
import { useAdminCreateRawMaterial, useAdminUpdateRawMaterial } from '../../../sdk/inventory';
import { usePermissions } from '../../auth/permissions/use-permissions';
import { useCategoryTypes } from '../hooks/use-category-types';
import { categoryTypesQueryOptions, type CategoryTypeRow } from '../api/category-types';
import { CategoryTypeDrawer } from './category-type-drawer';
import type { RawMaterialRow } from '../api/raw-materials';
import {
  useRawMaterialForm,
  rawMaterialFormDefaults,
  type RawMaterialFormValues,
} from '../hooks/useCreateRawMaterialForm';


// Shared between the options query and the inline-add cache append — the
// optimistic write only lands if both build the SAME query key.
const CATEGORY_TYPES_QUERY = { page: 0, pageSize: 100, sort: 'name' };

export interface RawMaterialDrawerProps {
  open: boolean;
  /** Row being edited; null/undefined → create mode. */
  material?: RawMaterialRow | null;
  onClose: () => void;
  /** Fired after save; create passes the new row so callers can auto-select it. */
  onSaved: (item?: RawMaterialRow) => void;
  /** Create-mode seed (e.g. cross-kind transfer quick-add): name + category name to pre-select. */
  prefill?: { name?: string; category?: string | null; uom?: string };
}

export function RawMaterialDrawer({ open, material, onClose, onSaved, prefill }: RawMaterialDrawerProps) {
  const { toast } = useToast();
  const isEdit = material != null;
  const { control, handleSubmit, reset, setError, setValue } = useRawMaterialForm(material);
  const { handleApiError } = useFormApiErrors(setError);
  const { categoryTypes, isLoading: categoryTypesLoading } = useCategoryTypes(CATEGORY_TYPES_QUERY);

  const categoryItems = useMemo(
    () => categoryTypes.map((c) => ({ value: String(c.id), label: c.name })),
    [categoryTypes],
  );

  // Inline "add category from the RM form" (label-row pattern): the saved type
  // is appended to the cached options synchronously and auto-selected. The
  // category_types master is admin-only (feature 047), so the link is gated.
  const { can } = usePermissions();
  const canAddCategory = can('category_types', 'create');
  const [addingCategory, setAddingCategory] = useState(false);
  const qc = useQueryClient();
  const onCategorySaved = (type?: CategoryTypeRow) => {
    const categoriesKey = categoryTypesQueryOptions(CATEGORY_TYPES_QUERY).queryKey;
    if (type) {
      qc.setQueryData(categoriesKey, (prev) => {
        if (prev?.status !== 200) return prev;
        return {
          ...prev,
          data: { ...prev.data, results: [...prev.data.results, type], count: prev.data.count + 1 },
        };
      });
      setValue('category_type_id', String(type.id));
    }
    void qc.invalidateQueries({ queryKey: categoriesKey });
  };

  // Re-seed the form when the target row changes (or the drawer re-opens).
  // Create mode may carry a prefill (name + category matched by name).
  // Seed ONCE per open/target: `categoryTypes` is a dep only for the prefill
  // name→id match, and it also refreshes when a category type is added inline
  // from this form — without the guard that refresh reset the typed inputs.
  const seededRef = useRef<string | null>(null);
  useEffect(() => {
    if (!open) {
      seededRef.current = null;
      return;
    }
    // A prefilled create needs the category types loaded for the name match.
    if (material == null && prefill && categoryTypesLoading) return;
    const seedKey = material ? `edit-${material.id}` : 'create';
    if (seededRef.current === seedKey) return;
    seededRef.current = seedKey;
    const defaults = rawMaterialFormDefaults(material);
    if (material == null && prefill) {
      const cat = categoryTypes.find(
        (c) => c.name.trim().toLowerCase() === (prefill.category ?? '').trim().toLowerCase(),
      );
      reset({
        ...defaults,
        name: prefill.name ?? defaults.name,
        category_type_id: cat ? String(cat.id) : defaults.category_type_id,
        unit: prefill.uom ? normalizeUom(prefill.uom) : defaults.unit,
      });
      return;
    }
    reset(defaults);
  }, [open, material, prefill, categoryTypes, categoryTypesLoading, reset]);

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

  const createMutation = useAdminCreateRawMaterial({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'Raw material created.') });
        reset(rawMaterialFormDefaults());
        onSaved(response.status === 201 ? response.data : undefined);
        onClose();
      },
      onError: onMutationError,
    },
  });

  const updateMutation = useAdminUpdateRawMaterial({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'Raw material updated.') });
        onSaved();
        onClose();
      },
      onError: onMutationError,
    },
  });

  const handleClose = () => {
    reset(rawMaterialFormDefaults(material));
    onClose();
  };

  const onSubmit = (data: RawMaterialFormValues) => {
    const base = {
      name: data.name,
      code: data.code,
      category_type_id: data.category_type_id ? Number(data.category_type_id) : null,
      unit: data.unit || null,
      reorder_level: data.reorder_level ? Number(data.reorder_level) : null,
    };
    if (isEdit) updateMutation.mutate({ materialId: material.id, data: base });
    else createMutation.mutate({ data: base });
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <CustomDrawer
      anchor="right"
      title={isEdit ? `Edit raw material` : 'Add raw material'}
      open={open}
      onClose={handleClose}
      drawerWidth="42rem"
      drawerPadding="0px"
    >
      <div className="flex min-h-full flex-col">
        {/* This drawer can stack over a host form (GRN/PO); React bubbles
            submit through portals, so stop it from also submitting the host. */}
        <form
          noValidate
          onSubmit={(e) => {
            e.stopPropagation();
            void handleSubmit(onSubmit)(e);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
            <RHFInput<RawMaterialFormValues> name="name" control={control} label="Name" required placeholder="Enter name" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RHFInput<RawMaterialFormValues> name="code" control={control} label="Code" required uppercase placeholder="Enter code" />
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <CustomLabel label="Category" htmlFor="category_type_id" />
                  {canAddCategory && (
                    <button
                      type="button"
                      onClick={() => setAddingCategory(true)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      + Add new
                    </button>
                  )}
                </div>
                <RHFSelect<RawMaterialFormValues>
                  name="category_type_id"
                  control={control}
                  placeholder={categoryItems.length ? 'Select category' : 'No categories yet'}
                  items={categoryItems}
                  enableDeselect
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RHFSelect<RawMaterialFormValues>
                name="unit"
                control={control}
                label="Unit of measure"
                required
                // Shared CAPS UOM vocabulary (utils/uom — same list as the price
                // list / PO / GRN); a legacy stored unit stays selectable in edit.
                items={uomItemsWith(material?.unit)}
                placeholder="Select unit"
                // A material's UOM is the single source of truth downstream (GRN,
                // batches, POs), so it's fixed after creation — editable only on add.
                isDisabled={isEdit}
              />
              <RHFInput<RawMaterialFormValues>
                name="reorder_level"
                control={control}
                label="Re-order level"
                required
                isDecimal
                placeholder="e.g. 12.5"
              />
            </div>
          </div>
          <div className="shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
            <CustomButton type="button" variant="outline" onClick={handleClose}>
              Cancel
            </CustomButton>
            <CustomButton type="submit" variant="primary" loading={saving}>
              {isEdit ? 'Save changes' : 'Add raw material'}
            </CustomButton>
          </div>
        </form>
      </div>

      {/* Inline category-type creation without leaving the RM form. */}
      <CategoryTypeDrawer
        open={addingCategory}
        type={null}
        onClose={() => setAddingCategory(false)}
        onSaved={onCategorySaved}
      />
    </CustomDrawer>
  );
}
