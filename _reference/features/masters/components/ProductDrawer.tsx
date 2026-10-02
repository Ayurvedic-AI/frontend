/**
 * Product create/edit drawer (feature 027; field set extended in 048).
 * One zod schema for both modes. Canonical field order matches the table:
 * SKU · Name · Category · HSN · Unit · Shelf life (months).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { CustomLabel } from '../../../common/custom-label';
import { RHFInput, RHFSelect } from '../../../common/rhf-wrappers';
import { useToast } from '../../../common/common-snackbar';
import { useFormApiErrors } from '../../../hooks/useFormApiErrors';
import { ApiError } from '../../../api/client';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import { toNumberOrNull } from '../../../utils/format';
import { uomItemsWith } from '../../../utils/uom';
import { useAdminCreateProduct, useAdminUpdateProduct } from '../../../sdk/inventory';
import { useProductCategories } from '../hooks/use-product-categories';
import { productCategoriesQueryOptions, type ProductCategoryRow } from '../api/product-categories';
import { ProductCategoryDrawer } from './product-category-drawer';
import type { ProductRow } from '../api/products';
import { useProductForm, productFormDefaults, type ProductFormValues } from '../hooks/useCreateProductForm';

// Shared between the options query and the inline-add cache append — the
// optimistic write only lands if both build the SAME query key.
const PRODUCT_CATEGORIES_QUERY = { page: 0, pageSize: 100, sort: 'name', activeOnly: true };

export interface ProductDrawerProps {
  open: boolean;
  /** Row being edited; null/undefined → create mode. */
  product?: ProductRow | null;
  onClose: () => void;
  /** Fired after save; create passes the new row so callers can auto-select it. */
  onSaved: (item?: ProductRow) => void;
  /** Create-mode seed (e.g. cross-kind transfer quick-add): name + category to pre-fill. */
  prefill?: { name?: string; category?: string | null; uom?: string };
}

export function ProductDrawer({ open, product, onClose, onSaved, prefill }: ProductDrawerProps) {
  const { toast } = useToast();
  const isEdit = product != null;
  const { control, handleSubmit, reset, setError, setValue } = useProductForm(product);
  const { handleApiError } = useFormApiErrors(setError);
  const { categories } = useProductCategories(PRODUCT_CATEGORIES_QUERY);

  // Inline "add category from the product form" (label-row pattern): the saved
  // category is appended to the cached options synchronously and auto-selected
  // (products store the category by NAME, not id).
  const [addingCategory, setAddingCategory] = useState(false);
  const qc = useQueryClient();
  const onCategorySaved = (cat?: ProductCategoryRow) => {
    const categoriesKey = productCategoriesQueryOptions(PRODUCT_CATEGORIES_QUERY).queryKey;
    if (cat) {
      qc.setQueryData(categoriesKey, (prev) => {
        if (prev?.status !== 200) return prev;
        return {
          ...prev,
          data: { ...prev.data, results: [...prev.data.results, cat], count: prev.data.count + 1 },
        };
      });
      setValue('category', cat.name);
    }
    void qc.invalidateQueries({ queryKey: categoriesKey });
  };

  // Category dropdown = the managed Product Categories list (active only); the
  // chosen name is stored in the free-text `category`. The current value stays
  // selectable on edit via a legacy option. Unit = the standard UOM list.
  const category = useWatch({ control, name: 'category' });
  const packSize = useWatch({ control, name: 'pack_size' });
  const categoryItems = useMemo(() => {
    const items = categories.map((c) => ({ value: c.name, label: c.name }));
    if (category && !items.some((o) => o.value === category)) {
      items.unshift({ value: category, label: category });
    }
    return items;
  }, [categories, category]);
  const unitItems = useMemo(() => uomItemsWith(packSize), [packSize]);

  // Re-seed the form ONCE per open/target (guarded so unrelated re-renders —
  // e.g. an inline "add category" refreshing its query — never reset inputs).
  const seededRef = useRef<string | null>(null);
  useEffect(() => {
    if (!open) {
      seededRef.current = null;
      return;
    }
    const seedKey = product ? `edit-${product.id}` : 'create';
    if (seededRef.current === seedKey) return;
    seededRef.current = seedKey;
    const defaults = productFormDefaults(product);
    if (product == null && prefill) {
      reset({
        ...defaults,
        name: prefill.name ?? defaults.name,
        category: prefill.category ?? defaults.category,
        pack_size: prefill.uom ?? defaults.pack_size,
      });
      return;
    }
    reset(defaults);
  }, [open, product, prefill, reset]);

  const onMutationError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 409) {
      setError('code', { type: 'manual', message: errorMessage(error) });
      return;
    }
    const general = handleApiError(error);
    toast({ severity: 'error', message: general ?? errorMessage(error) });
  };

  const createMutation = useAdminCreateProduct({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'Product created.') });
        reset(productFormDefaults());
        onSaved(response.status === 201 ? response.data : undefined);
        onClose();
      },
      onError: onMutationError,
    },
  });

  const updateMutation = useAdminUpdateProduct({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'Product updated.') });
        onSaved();
        onClose();
      },
      onError: onMutationError,
    },
  });

  const handleClose = () => {
    reset(productFormDefaults(product));
    onClose();
  };

  const onSubmit = (data: ProductFormValues) => {
    const payload = {
      name: data.name,
      // Blank SKU → null so the backend auto-generates a unique code.
      code: data.code || null,
      category: data.category || null,
      hsn: data.hsn || null,
      pack_size: data.pack_size || null,
      shelf_life_months: toNumberOrNull(data.shelf_life_months),
      reorder_level: toNumberOrNull(data.reorder_level),
    };
    if (isEdit) updateMutation.mutate({ productId: product.id, data: payload });
    else createMutation.mutate({ data: payload });
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <CustomDrawer
      anchor="right"
      title={isEdit ? `Edit product` : 'Add product'}
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RHFInput<ProductFormValues> name="code" control={control} label="SKU" uppercase placeholder="Auto if blank (e.g. ASHWAGANDHA-01)" />
              <RHFInput<ProductFormValues> name="name" control={control} label="Name" required placeholder="Enter name" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <CustomLabel label="Category" htmlFor="category" />
                  <button
                    type="button"
                    onClick={() => setAddingCategory(true)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    + Add new
                  </button>
                </div>
                <RHFSelect<ProductFormValues>
                  name="category"
                  control={control}
                  items={categoryItems}
                  placeholder={categoryItems.length ? 'Select category' : 'No categories yet'}
                  enableDeselect
                />
              </div>
              <RHFInput<ProductFormValues> name="hsn" control={control} label="HSN" isNumeric maxLength={8} placeholder="Enter HSN" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RHFSelect<ProductFormValues>
                name="pack_size"
                control={control}
                label="Unit"
                required
                items={unitItems}
                placeholder="Select unit"
              />
              <RHFInput<ProductFormValues>
                name="shelf_life_months"
                control={control}
                label="Shelf life (months)"
                required
                placeholder="e.g. 24"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <RHFInput<ProductFormValues>
                name="reorder_level"
                control={control}
                label="Re-order level"
                required
                isDecimal
                placeholder="Low-stock threshold"
              />
            </div>
          </div>
          <div className="shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
            <CustomButton type="button" variant="outline" onClick={handleClose}>
              Cancel
            </CustomButton>
            <CustomButton type="submit" variant="primary" loading={saving}>
              {isEdit ? 'Save changes' : 'Add product'}
            </CustomButton>
          </div>
        </form>
      </div>

      {/* Inline category creation without leaving the product form. */}
      <ProductCategoryDrawer
        open={addingCategory}
        category={null}
        onClose={() => setAddingCategory(false)}
        onSaved={onCategorySaved}
      />
    </CustomDrawer>
  );
}
