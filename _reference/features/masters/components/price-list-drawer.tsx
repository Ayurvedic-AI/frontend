/**
 * Price List add/edit drawer (feature 070): Type → Item + dynamic pack rows.
 * A price list can belong to a finished good (product) OR a raw material —
 * the Type select decides the item picker and the save endpoint. Each pack
 * row is [quantity + unit | price] (shared RHFAmountUnit control) — the unit
 * comes from the shared UOM dropdown so pack labels stay consistent and link
 * cleanly to sales-order packs. Saving replaces the item's whole set (each
 * re-save bumps the version shown in the list).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { RHFInput, RHFSelect, RHFAutocomplete, RHFAmountUnit } from '../../../common/rhf-wrappers';
import { CustomLabel } from '../../../common/custom-label';
import type { AutocompleteOption } from '../../../common/custom-auto-complete';
import { useToast } from '../../../common/common-snackbar';
import { useFormApiErrors } from '../../../hooks/useFormApiErrors';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import { uomItemsWith } from '../../../utils/uom';
import {
  getAdminListPriceListQueryOptions,
  useAdminSetProductPrices,
  useAdminSetRawMaterialPrices,
} from '../../../sdk/inventory';
import type { PriceListResponse } from '../../../sdk/schemas';
import { useProducts } from '../hooks/useProducts';
import { useRawMaterials } from '../hooks/useRawMaterials';
import { productsQueryOptions, type ProductRow } from '../api/products';
import { rawMaterialsQueryOptions, type RawMaterialRow } from '../api/raw-materials';
import { ProductDrawer } from './ProductDrawer';
import { RawMaterialDrawer } from './RawMaterialDrawer';
import type { PriceListRow } from '../api/price-list';
import {
  usePriceListForm,
  priceListFormDefaults,
  composePackLabel,
  parsePackLabel,
  EMPTY_ENTRY,
  type PriceListFormValues,
} from '../hooks/use-price-list-form';

export interface PriceListDrawerProps {
  open: boolean;
  /** Row being edited; null/undefined → create mode. */
  row?: PriceListRow | null;
  /** Create mode only: preselect this product (inline-add from other screens,
   *  e.g. the production completion drawer). Existing packs prefill as usual. */
  initialProductId?: number | string;
  /** True → the save REPLACES the latest version instead of appending a new
   *  one (inline entry points; the Masters screen keeps version history). */
  updateInPlace?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const KIND_ITEMS = [
  { value: 'product', label: 'Finished good' },
  { value: 'raw_material', label: 'Raw material' },
];

const PICKER_QUERY = { page: 0, pageSize: 100, sort: 'name' } as const;

/** One entry row — hooks at component level so the unit dropdown can keep a
 * legacy/non-standard unit (e.g. "Akhand") selectable. */
function EntryRow({
  control,
  index,
  onRemove,
  canRemove,
}: {
  control: ReturnType<typeof usePriceListForm>['control'];
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const unit = useWatch({ control, name: `entries.${index}.unit` });
  const unitItems = uomItemsWith(unit);
  return (
    <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[1fr_8rem_2.5rem]">
      <RHFAmountUnit<PriceListFormValues>
        control={control}
        valueName={`entries.${index}.qty`}
        unitName={`entries.${index}.unit`}
        unitOptions={unitItems}
        valuePlaceholder="Qty (e.g. 500)"
      />
      <RHFInput<PriceListFormValues>
        name={`entries.${index}.price`}
        control={control}
        isDecimal
        placeholder="Price (₹)"
      />
      <button
        type="button"
        aria-label="Remove pack price"
        onClick={onRemove}
        disabled={!canRemove}
        className="mt-1.5 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-destructive disabled:opacity-40"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

export function PriceListDrawer({ open, row, initialProductId, updateInPlace, onClose, onSaved }: PriceListDrawerProps) {
  const { toast } = useToast();
  const isEdit = row != null;
  const { control, handleSubmit, reset, setError, setValue } = usePriceListForm(row);
  const { handleApiError } = useFormApiErrors(setError);
  const { fields, append, remove } = useFieldArray({ control, name: 'entries' });
  const { products } = useProducts();
  const { materials } = useRawMaterials();
  const qc = useQueryClient();

  const kind = useWatch({ control, name: 'kind' });
  const itemId = useWatch({ control, name: 'item_id' });
  const isRm = kind === 'raw_material';

  // Changing the Type invalidates the item selection.
  const prevKind = useRef(kind);
  useEffect(() => {
    if (prevKind.current !== kind) {
      prevKind.current = kind;
      if (!isEdit) setValue('item_id', '');
    }
  }, [kind, isEdit, setValue]);


  // Inline "add new" (BomDrawer label-row pattern) — create a product/RM
  // without leaving the drawer; the saved item auto-selects.
  const [addingItem, setAddingItem] = useState(false);
  const onProductSaved = (item?: ProductRow) => {
    const key = productsQueryOptions(PICKER_QUERY).queryKey;
    if (item) {
      // Append the new product to the cached options SYNCHRONOUSLY so the
      // picker can render it at once (the invalidate then syncs with the server).
      qc.setQueryData(key, (prev) => {
        if (prev?.status !== 200) return prev;
        return {
          ...prev,
          data: { ...prev.data, results: [...prev.data.results, item], count: prev.data.count + 1 },
        };
      });
      setValue('item_id', String(item.id));
    }
    void qc.invalidateQueries({ queryKey: key });
  };
  const onRawMaterialSaved = (item?: RawMaterialRow) => {
    const key = rawMaterialsQueryOptions(PICKER_QUERY).queryKey;
    if (item) {
      qc.setQueryData(key, (prev) => {
        if (prev?.status !== 200) return prev;
        return {
          ...prev,
          data: { ...prev.data, results: [...prev.data.results, item], count: prev.data.count + 1 },
        };
      });
      setValue('item_id', String(item.id));
    }
    void qc.invalidateQueries({ queryKey: key });
  };

  // All items stay selectable — saving one that already has a price list
  // simply replaces it as the next version (v2, v3, …). Edit mode locks the
  // item and makes sure it is present even if not on the picker page.
  const itemOptions = useMemo<AutocompleteOption[]>(() => {
    const editId = isEdit ? String((isRm ? row.raw_material_id : row.product_id) ?? '') : null;
    const rows = isRm
      ? materials.map((m) => ({ id: m.id, name: m.name, category: m.rm_category_name ?? null }))
      : products.map((p) => ({ id: p.id, name: p.name, category: p.category ?? null }));
    const items = rows
      .filter((r) => (isEdit ? String(r.id) === editId : true))
      .map((r) => ({
        key: String(r.id),
        value: r.category ? `${r.name} - ${r.category}` : r.name,
      }));
    if (isEdit && editId && !items.some((o) => o.key === editId)) {
      items.unshift({ key: editId, value: row.product_name });
    }
    return items;
  }, [isRm, isEdit, row, materials, products]);

  useEffect(() => {
    if (open) {
      prevKind.current = row?.item_kind === 'raw_material' ? 'raw_material' : 'product';
      reset(priceListFormDefaults(row));
      // Inline-add entry point: preselect the caller's product (create mode);
      // the existing-list prefill below then loads its latest packs as usual.
      if (!row && initialProductId != null) {
        setValue('item_id', String(initialProductId));
      }
    }
  }, [open, row, reset, initialProductId, setValue]);

  // Create mode: picking an item that ALREADY has a price list prefills its
  // current entries — saving then simply becomes the next version (v2, v3, …)
  // instead of silently starting from a blank sheet.
  const selectedCode = !isEdit && itemId
    ? (isRm
        ? materials.find((m) => String(m.id) === itemId)?.code
        : products.find((p) => String(p.id) === itemId)?.code)
    : undefined;
  const existingQuery = useQuery({
    ...getAdminListPriceListQueryOptions({ search: selectedCode ?? '', limit: 100 }),
    enabled: open && Boolean(selectedCode),
  });
  // Server orders versions DESC per item → first match is the LATEST.
  const existingItem = (existingQuery.data as { data: PriceListResponse } | undefined)?.data.items.find(
    (i) => String((isRm ? i.raw_material_id : i.product_id) ?? '') === itemId,
  );
  // Tracks which item's saved entries currently populate the form so a change
  // of item clears them — item A's packs can never be saved against item B.
  const prefilledFor = useRef<string | null>(null);
  useEffect(() => {
    if (isEdit) return;
    if (existingItem) {
      if (prefilledFor.current !== itemId) {
        prefilledFor.current = itemId;
        setValue(
          'entries',
          existingItem.entries.map((e) => ({
            ...parsePackLabel(e.pack_label),
            price: String(e.price),
          })),
        );
      }
    } else if (prefilledFor.current !== null && prefilledFor.current !== itemId) {
      prefilledFor.current = null;
      setValue('entries', [{ ...EMPTY_ENTRY }]);
    }
  }, [existingItem, itemId, isEdit, setValue]);

  const mutationCallbacks = {
    onSuccess: (response: unknown) => {
      toast({
        severity: 'success',
        message: successMessage(response, isEdit ? 'Price list updated.' : 'Price list added.'),
      });
      reset(priceListFormDefaults());
      onSaved();
      onClose();
    },
    onError: (error: unknown) => {
      const general = handleApiError(error);
      toast({ severity: 'error', message: general ?? errorMessage(error) });
    },
  };
  const setProductMutation = useAdminSetProductPrices({ mutation: mutationCallbacks });
  const setRmMutation = useAdminSetRawMaterialPrices({ mutation: mutationCallbacks });
  const isSaving = setProductMutation.isPending || setRmMutation.isPending;

  const handleClose = () => {
    reset(priceListFormDefaults(row));
    onClose();
  };

  const onSubmit = (data: PriceListFormValues) => {
    // size_label is deliberately omitted — the backend carries the latest
    // version's value forward (the drawer no longer exposes Size).
    const body = {
      entries: data.entries.map((e) => ({
        pack_label: composePackLabel(e),
        price: Number(e.price),
      })),
      // Inline entry points update the latest version in place — no version bump.
      in_place: updateInPlace ?? false,
    };
    if (data.kind === 'raw_material') {
      setRmMutation.mutate({ rawMaterialId: Number(data.item_id), data: body });
    } else {
      setProductMutation.mutate({ productId: Number(data.item_id), data: body });
    }
  };

  return (
    <CustomDrawer
      anchor="right"
      title={isEdit ? `Edit price list — ${row.product_name}` : 'Add price list'}
      open={open}
      onClose={handleClose}
      drawerWidth="42rem"
      drawerPadding="0px"
    >
      <div className="flex min-h-full flex-col">
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[11rem_1fr]">
              <div className="flex flex-col gap-1">
                <CustomLabel label="Type" htmlFor="kind" isRequired />
                <RHFSelect<PriceListFormValues>
                  name="kind"
                  control={control}
                  items={KIND_ITEMS}
                  placeholder="Type"
                  isDisabled={isEdit}
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <CustomLabel
                    label={isRm ? 'Raw material' : 'Product'}
                    htmlFor="item_id"
                    isRequired
                  />
                  {!isEdit && (
                    <button
                      type="button"
                      onClick={() => setAddingItem(true)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      + Add new
                    </button>
                  )}
                </div>
                <RHFAutocomplete<PriceListFormValues>
                  name="item_id"
                  control={control}
                  options={itemOptions}
                  placeholder={
                    itemOptions.length
                      ? `Search ${isRm ? 'raw material' : 'product'}…`
                      : `No ${isRm ? 'raw materials' : 'products'} available`
                  }
                  hasStartSearchIcon
                  isDisabled={isEdit}
                />
              </div>
            </div>

            {/* Create mode: picking an already-priced item prefills its latest
                version — make that explicit so a save is understood as vN+1. */}
            {!isEdit && existingItem && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-foreground">
                This item already has a price list (v{existingItem.version ?? 1}) — its packs are
                prefilled below. Saving creates version {(existingItem.version ?? 1) + 1}.
              </div>
            )}

            <div className="rounded-lg border border-border bg-card p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pack prices
                  <span className="ml-2 font-normal normal-case">
                    ({fields.length} {fields.length === 1 ? 'pack' : 'packs'})
                  </span>
                </p>
                <CustomButton
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<Plus className="size-4" />}
                  onClick={() => append({ ...EMPTY_ENTRY })}
                >
                  Add pack price
                </CustomButton>
              </div>
              <p className="mb-2 text-xs text-muted-foreground">
                One row per pack the item is sold in — e.g. 1 KG, 500 GM, 250 GM.
              </p>
              <div className="mb-1 hidden grid-cols-[1fr_8rem_2.5rem] gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
                <span>Qty / Unit</span>
                <span>Price (₹)</span>
                <span />
              </div>
              <div className="flex flex-col gap-2">
                {fields.map((field, index) => (
                  <EntryRow
                    key={field.id}
                    control={control}
                    index={index}
                    canRemove={fields.length > 1}
                    onRemove={() => remove(index)}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
            <CustomButton type="button" variant="outline" onClick={handleClose}>
              Cancel
            </CustomButton>
            <CustomButton type="submit" variant="primary" loading={isSaving}>
              {isEdit ? 'Save changes' : 'Add price list'}
            </CustomButton>
          </div>
        </form>
      </div>

      {/* Inline master creation without leaving the price list. */}
      <ProductDrawer
        open={addingItem && !isRm}
        product={null}
        onClose={() => setAddingItem(false)}
        onSaved={onProductSaved}
      />
      <RawMaterialDrawer
        open={addingItem && isRm}
        material={null}
        onClose={() => setAddingItem(false)}
        onSaved={onRawMaterialSaved}
      />
    </CustomDrawer>
  );
}
