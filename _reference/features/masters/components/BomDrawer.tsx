/**
 * BOM create/edit drawer — Product selector + FOUR recipe sections:
 *   Section A  — stock materials whose quantity SCALES with batch size,
 *   Section B  — stock materials with a FIXED quantity per batch run,
 *   Ingredients (scaled / fixed) — free-text items NOT tracked in stock
 *   (e.g. juice), with custom name + quantity + unit; display-only.
 * Only Sections A/B reserve & consume stock on a BOM order (A × batch, B as-is).
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { useFieldArray, useWatch, type Control, type UseFormSetValue } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Trash2 } from 'lucide-react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { CustomLabel } from '../../../common/custom-label';
import { RHFAutocomplete, RHFInput, RHFSelect } from '../../../common/rhf-wrappers';
import { useToast } from '../../../common/common-snackbar';
import { useFormApiErrors } from '../../../hooks/useFormApiErrors';
import { errorMessage, successMessage } from '../../../utils/api-messages';
import { uomItemsWith } from '../../../utils/uom';
import { useAdminCreateBom, useAdminUpdateBom } from '../../../sdk/inventory';
import type { CreateBomLineRequest } from '../../../sdk/schemas';
import type { BomRow } from '../api/boms';
import { useProducts } from '../hooks/useProducts';
import { productsQueryOptions, type ProductRow } from '../api/products';
import { ProductDrawer } from './ProductDrawer';
import { useRawMaterials } from '../hooks/useRawMaterials';
import { useSemiFinishedGoods } from '../hooks/useSemiFinishedGoods';
import { useProductionFlows } from '../hooks/use-production-flows';
import { getAdminListMaterialsQueryOptions } from '../../../sdk/inventory';
import { rawMaterialsQueryOptions, type RawMaterialRow } from '../api/raw-materials';
import {
  semiFinishedGoodsQueryOptions,
  type SemiFinishedGoodRow,
} from '../api/semi-finished-goods';
import { RawMaterialDrawer } from './RawMaterialDrawer';
import { SemiFinishedGoodDrawer } from './SemiFinishedGoodDrawer';
import { ProductionFlowDrawer } from './production-flow-drawer';
import {
  useBomForm,
  bomFormDefaults,
  emptyBomLine,
  emptyIngredientLine,
  type BomFormValues,
} from '../hooks/useCreateBomForm';

// Both picker hooks default to this query; the inline-add cache appends must
// build the SAME query key for the optimistic write to land.
const PICKER_QUERY = { page: 0, pageSize: 100, sort: 'name' };

export interface BomDrawerProps {
  open: boolean;
  bom?: BomRow | null;
  /** When set (and not editing) the drawer opens in CREATE mode pre-filled from
   *  this BOM — the "Create new version" action. The original is left untouched. */
  seedFrom?: BomRow | null;
  /** Suggested version-tagged name for the new version, e.g. "Ampachak Vati (v2)". */
  seedName?: string;
  onClose: () => void;
  /** Create mode passes the created BOM so callers can auto-select it. */
  onSaved: (bom?: BomRow) => void;
}

/** One free-text ingredient row (name | qty | unit dropdown). */
function IngredientRow({
  control,
  name,
  index,
  onRemove,
}: {
  control: Control<BomFormValues>;
  name: 'ing_scaled' | 'ing_fixed';
  index: number;
  onRemove: () => void;
}) {
  const unit = useWatch({ control, name: `${name}.${index}.unit` });
  return (
    <div className="grid items-start gap-1.5 grid-cols-1 sm:grid-cols-[1fr_120px_120px_36px]">
      <RHFInput
        name={`${name}.${index}.ingredient_name`}
        control={control}
        placeholder="Ingredient (e.g. Lemon juice)"
      />
      <RHFInput name={`${name}.${index}.quantity`} control={control} placeholder="Quantity" />
      <RHFSelect
        name={`${name}.${index}.unit`}
        control={control}
        items={uomItemsWith(unit)}
        placeholder="Unit"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove line"
        className="mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

export type BomLineItemType = 'rm' | 'sf' | 'fg';

const LINE_TYPE_ITEMS = [
  { value: 'rm', label: 'Raw material' },
  { value: 'sf', label: 'Semi-finished' },
  { value: 'fg', label: 'Finished good' },
];

const OUTPUT_KIND_ITEMS = [
  { value: 'product', label: 'Finished good' },
  { value: 'sfg', label: 'Semi-finished good' },
];

/** One stock-material row: Type select → filtered item picker → qty → unit. */
function MaterialLineRow({
  control,
  sectionKey,
  index,
  optionsByType,
  unit,
  onRemove,
  setValue,
}: {
  control: Control<BomFormValues>;
  sectionKey: 'lines_a' | 'lines_b';
  index: number;
  optionsByType: Record<BomLineItemType, { key: string; value: string }[]>;
  unit: string;
  onRemove: () => void;
  setValue: UseFormSetValue<BomFormValues>;
}) {
  const type = (useWatch({ control, name: `${sectionKey}.${index}.item_type` }) ??
    'rm') as BomLineItemType;
  const picked = useWatch({ control, name: `${sectionKey}.${index}.raw_material_id` });
  const options = useMemo(() => optionsByType[type] ?? [], [optionsByType, type]);
  // Changing the row's type invalidates a picked material that doesn't belong
  // to the new type (a programmatic fill of a matching material survives).
  const prevType = useRef(type);
  useEffect(() => {
    if (prevType.current !== type) {
      prevType.current = type;
      if (picked && !options.some((o) => o.key === picked)) {
        setValue(`${sectionKey}.${index}.raw_material_id`, '');
      }
    }
  }, [type, picked, options, sectionKey, index, setValue]);
  return (
    <div className="grid items-start gap-1.5 grid-cols-1 sm:grid-cols-[130px_1fr_120px_120px_36px] *:min-w-0">
      <RHFSelect
        name={`${sectionKey}.${index}.item_type`}
        control={control}
        items={LINE_TYPE_ITEMS}
        placeholder="Type"
      />
      <RHFAutocomplete
        name={`${sectionKey}.${index}.raw_material_id`}
        control={control}
        options={options}
        hasStartSearchIcon
        placeholder={options.length ? 'Search material…' : 'No materials of this type yet'}
      />
      <RHFInput name={`${sectionKey}.${index}.quantity`} control={control} placeholder="Quantity" />
      <input
        type="text"
        value={unit}
        disabled
        placeholder="Unit"
        className="h-11 w-full rounded-md border border-input bg-secondary px-3 text-sm text-muted-foreground"
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove line"
        className="mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

export function BomDrawer({ open, bom, seedFrom, seedName, onClose, onSaved }: BomDrawerProps) {
  const { toast } = useToast();
  const isEdit = bom != null;
  // Source the form seeds from: the row being edited, or the row being cloned.
  const seed = bom ?? seedFrom ?? null;
  const isDuplicate = !isEdit && seedFrom != null;
  const { control, handleSubmit, reset, setError, setValue, watch, trigger, formState } =
    useBomForm(seed);
  // Production flows master (072 dynamic): the flow dropdown mirrors it live.
  const { flows, refetch: refetchFlows } = useProductionFlows();
  // Inline "add flow" — saving refreshes the dropdown and auto-selects the new flow.
  const [addingFlow, setAddingFlow] = useState(false);
  const flowItems = useMemo(
    () =>
      flows.map((f) => ({ value: f.code, label: f.name })),
    [flows],
  );
  // Inline "add master from BOM" (label-row pattern) — the recipe's output
  // (product / SFG) and its materials must be creatable without leaving the
  // drawer; the saved master auto-selects.
  const [addingOutput, setAddingOutput] = useState(false);
  const [addingMaterial, setAddingMaterial] = useState<{
    section: 'lines_a' | 'lines_b';
    type: BomLineItemType;
  } | null>(null);
  // "Other ingredients" starts collapsed on a fresh recipe and opens itself
  // when the BOM being edited/cloned already has free-text lines.
  const [ingOpen, setIngOpen] = useState(false);
  // Field-less backend rejection (e.g. recipe locked by an active order), shown inline.
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { handleApiError } = useFormApiErrors(setError);
  const linesA = useFieldArray({ control, name: 'lines_a' });
  const linesB = useFieldArray({ control, name: 'lines_b' });
  const ingScaled = useFieldArray({ control, name: 'ing_scaled' });
  const ingFixed = useFieldArray({ control, name: 'ing_fixed' });
  const { products } = useProducts();
  const { semiFinishedGoods } = useSemiFinishedGoods();
  const qc = useQueryClient();

  // The duplicate-material rule (#218) spans Sections A + B, but RHF only
  // revalidates the field being edited — changing the OTHER copy of a
  // duplicate would leave a stale error on the flagged row. After a failed
  // submit, re-run validation on both sections whenever any picked material
  // changes so cross-row/cross-section errors clear (and re-flag) live.
  const watchedA = useWatch({ control, name: 'lines_a' });
  const watchedB = useWatch({ control, name: 'lines_b' });
  const pickedKey = [...(watchedA ?? []), ...(watchedB ?? [])]
    .map((l) => l.raw_material_id)
    .join('|');
  useEffect(() => {
    if (formState.isSubmitted) void trigger(['lines_a', 'lines_b']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedKey]);

  // Auto-select an inline-created material into the section the link was
  // clicked in: fill its first material-less row, else append a new row.
  const fillLine = (section: 'lines_a' | 'lines_b', type: BomLineItemType, key: string) => {
    const values = watch(section) ?? [];
    const emptyIdx = values.findIndex((l) => !l.raw_material_id);
    const target = section === 'lines_a' ? linesA : linesB;
    if (emptyIdx >= 0) {
      setValue(`${section}.${emptyIdx}.item_type`, type);
      setValue(`${section}.${emptyIdx}.raw_material_id`, key);
    } else {
      target.append({ ...emptyBomLine(), item_type: type, raw_material_id: key });
    }
  };

  // sf/fg masters mirror into the unified materials table — resolve the new
  // mirror row's id (the picker's `mat:` key space) after an inline create.
  const fillLineFromMaterialCode = async (
    section: 'lines_a' | 'lines_b',
    type: BomLineItemType,
    code: string,
  ) => {
    const opts = getAdminListMaterialsQueryOptions();
    await qc.invalidateQueries({ queryKey: opts.queryKey });
    const res = await qc.fetchQuery(opts);
    const mat = res?.status === 200 ? res.data.items.find((m) => m.material_code === code) : undefined;
    if (mat) fillLine(section, type, `mat:${mat.id}`);
  };

  const onProductSaved = (item?: ProductRow) => {
    const productsKey = productsQueryOptions(PICKER_QUERY).queryKey;
    if (item) {
      // Append the new product to the cached options SYNCHRONOUSLY so the
      // select can render it at once (the invalidate then syncs with the server).
      qc.setQueryData(productsKey, (prev) => {
        if (prev?.status !== 200) return prev;
        return {
          ...prev,
          data: { ...prev.data, results: [...prev.data.results, item], count: prev.data.count + 1 },
        };
      });
      if (addingMaterial?.type === 'fg') {
        void fillLineFromMaterialCode(addingMaterial.section, 'fg', item.code);
      } else {
        setValue('product_id', String(item.id));
      }
    }
    void qc.invalidateQueries({ queryKey: productsKey });
  };
  const onSfgSaved = (item?: SemiFinishedGoodRow) => {
    const sfgKey = semiFinishedGoodsQueryOptions(PICKER_QUERY).queryKey;
    if (item) {
      qc.setQueryData(sfgKey, (prev) => {
        if (prev?.status !== 200) return prev;
        return {
          ...prev,
          data: { ...prev.data, results: [...prev.data.results, item], count: prev.data.count + 1 },
        };
      });
      if (addingMaterial?.type === 'sf') {
        void fillLineFromMaterialCode(addingMaterial.section, 'sf', item.code);
      } else {
        setValue('sfg_id', String(item.id));
      }
    }
    void qc.invalidateQueries({ queryKey: sfgKey });
  };
  const onRmSaved = (item?: RawMaterialRow) => {
    const rmKey = rawMaterialsQueryOptions(PICKER_QUERY).queryKey;
    if (item && addingMaterial) {
      qc.setQueryData(rmKey, (prev) => {
        if (prev?.status !== 200) return prev;
        return {
          ...prev,
          data: { ...prev.data, results: [...prev.data.results, item], count: prev.data.count + 1 },
        };
      });
      fillLine(addingMaterial.section, 'rm', `rm:${item.id}`);
    }
    void qc.invalidateQueries({ queryKey: rmKey });
  };

  // Only active products are selectable as the output. When editing a BOM whose
  // product was since deactivated, keep that one in the list so the selection
  // isn't silently lost.
  const productItems = useMemo(
    () =>
      products
        .filter((p) => p.is_active || String(p.id) === String(seed?.product_id ?? ''))
        .map((p) => ({ key: String(p.id), value: p.category ? `${p.name} - ${p.category}` : p.name })),
    [products, seed],
  );
  // SFG output picker (mirrors productItems: active-only + keep the edited link).
  const sfgItems = useMemo(
    () =>
      semiFinishedGoods
        .filter((s) => s.is_active || String(s.id) === String(seed?.semi_finished_good_id ?? ''))
        .map((s) => ({
          key: String(s.id),
          value: s.sfg_category_name ? `${s.name} - ${s.sfg_category_name}` : s.name,
        })),
    [semiFinishedGoods, seed],
  );
  const outputKind = useWatch({ control, name: 'output_kind' });

  const { materials } = useRawMaterials();
  // A recipe may consume a semi-finished or finished good, not only a raw
  // material (Shankha Vati is made from shankha bhasma). Raw materials keep
  // their own id space, so an option key carries its source: `rm:<raw_material>`
  // or `mat:<inventory material>` — see `componentIds` on submit.
  const inventoryQuery = useQuery(getAdminListMaterialsQueryOptions());
  const inventoryMaterials = useMemo(() => {
    const res = inventoryQuery.data;
    const items = res?.status === 200 ? res.data.items : [];
    return items.filter((m) => m.material_type === 'sf' || m.material_type === 'fg');
  }, [inventoryQuery.data]);

  // Per-type option lists for the line pickers, labelled "Name - Category".
  // sf/fg categories come from their masters, joined onto the inventory
  // mirror rows by code.
  const optionsByType = useMemo<Record<BomLineItemType, { key: string; value: string }[]>>(() => {
    const sfgCatByCode = new Map(semiFinishedGoods.map((s) => [s.code, s.sfg_category_name]));
    const productCatByCode = new Map(products.map((p) => [p.code, p.category]));
    return {
      rm: materials.map((m) => ({
        key: `rm:${m.id}`,
        value: `${m.name} - ${m.rm_category_name ?? m.category_type_name ?? m.code}`,
      })),
      sf: inventoryMaterials
        .filter((m) => m.material_type === 'sf')
        .map((m) => ({
          key: `mat:${m.id}`,
          value: `${m.material_name} - ${sfgCatByCode.get(m.material_code) ?? m.material_code}`,
        })),
      fg: inventoryMaterials
        .filter((m) => m.material_type === 'fg')
        .map((m) => ({
          key: `mat:${m.id}`,
          value: `${m.material_name} - ${productCatByCode.get(m.material_code) ?? m.material_code}`,
        })),
    };
  }, [materials, inventoryMaterials, semiFinishedGoods, products]);
  // Key -> unit, for the disabled Unit box next to each line.
  const rmById = useMemo(
    () =>
      new Map<string, { unit?: string | null }>([
        ...materials.map((m) => [`rm:${m.id}`, m] as [string, { unit?: string | null }]),
        ...inventoryMaterials.map(
          (m) => [`mat:${m.id}`, { unit: m.uom }] as [string, { unit?: string | null }],
        ),
      ]),
    [materials, inventoryMaterials],
  );

  /** Split a picker key back into the two mutually-exclusive id fields. */
  const componentIds = (key: string | null | undefined) => {
    if (!key) return { raw_material_id: null, material_id: null };
    if (key.startsWith('mat:')) return { raw_material_id: null, material_id: Number(key.slice(4)) };
    const id = key.startsWith('rm:') ? key.slice(3) : key;
    return { raw_material_id: Number(id), material_id: null };
  };

  useEffect(() => {
    if (open) reset(bomFormDefaults(seed));
  }, [open, seed, reset]);

  // Re-derive the ingredients-collapsed state when the drawer (re)opens —
  // render-time snapshot pattern (the repo's no-effect convention), so a BOM
  // that already has free-text lines opens with the group expanded.
  const ingOpenKey = open ? `open:${bom?.id ?? ''}:${seedFrom?.id ?? ''}` : 'closed';
  const [lastIngOpenKey, setLastIngOpenKey] = useState(ingOpenKey);
  if (lastIngOpenKey !== ingOpenKey) {
    setLastIngOpenKey(ingOpenKey);
    if (open) {
      const defaults = bomFormDefaults(seed);
      setIngOpen(defaults.ing_scaled.length + defaults.ing_fixed.length > 0);
    }
  }

  const onMutationError = (error: unknown) => {
    const general = handleApiError(error);
    const message = general ?? errorMessage(error);
    // Keep field-less failures (e.g. the recipe-locked-by-active-order 409)
    // visible inside the drawer, not just as a transient toast.
    if (general != null) setSubmitError(message);
    toast({ severity: 'error', message });
  };

  const createMutation = useAdminCreateBom({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'BOM created.') });
        reset(bomFormDefaults());
        onSaved(response.status === 201 ? response.data : undefined);
        onClose();
      },
      onError: onMutationError,
    },
  });

  const updateMutation = useAdminUpdateBom({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'BOM updated.') });
        onSaved();
        onClose();
      },
      onError: onMutationError,
    },
  });

  const handleClose = () => {
    reset(bomFormDefaults(seed));
    setSubmitError(null);
    onClose();
  };

  const onSubmit = (data: BomFormValues) => {
    setSubmitError(null);
    const isSfgOutput = data.output_kind === 'sfg';
    const product = products.find((p) => String(p.id) === data.product_id);
    const sfg = semiFinishedGoods.find((s) => String(s.id) === data.sfg_id);
    const outputName = isSfgOutput ? sfg?.name : product?.name;
    // Name tracks the output, but any " (vN)" version tag is preserved.
    const VERSION_TAG = /\s*\(v\d+\)\s*$/i;
    const base = (outputName ?? seed?.name ?? '').replace(VERSION_TAG, '').trim();
    const tag = isEdit ? bom.name.match(VERSION_TAG)?.[0]?.trim() ?? '' : '';
    const name = isDuplicate && seedName ? seedName : tag ? `${base} ${tag}` : base;

    const materialLine = (
      l: BomFormValues['lines_a'][number],
      section: CreateBomLineRequest['section'],
    ): CreateBomLineRequest => ({
      section,
      ...componentIds(l.raw_material_id),
      quantity: l.quantity || undefined,
      unit: rmById.get(l.raw_material_id)?.unit || null,
      ingredient_name: null,
      ar_no: null,
      net_weight: null,
    });
    const ingredientLine = (
      l: BomFormValues['ing_scaled'][number],
      section: CreateBomLineRequest['section'],
    ): CreateBomLineRequest => ({
      section,
      raw_material_id: null,
      material_id: null,
      quantity: l.quantity || undefined,
      unit: l.unit || null,
      ingredient_name: l.ingredient_name,
      ar_no: null,
      net_weight: null,
    });

    const payload = {
      name,
      product_id: !isSfgOutput && data.product_id ? Number(data.product_id) : null,
      semi_finished_good_id: isSfgOutput && data.sfg_id ? Number(data.sfg_id) : null,
      flow_type: data.flow_type,
      output_qty: data.output_qty ? Number(data.output_qty) : null,
      lines: [
        ...data.lines_a.map((l) => materialLine(l, 'RAW_MATERIAL')),
        ...data.lines_b.map((l) => materialLine(l, 'FIXED_MATERIAL')),
        ...data.ing_scaled.map((l) => ingredientLine(l, 'INGREDIENT_SCALED')),
        ...data.ing_fixed.map((l) => ingredientLine(l, 'INGREDIENT_FIXED')),
      ],
    };
    if (isEdit) updateMutation.mutate({ bomId: bom.id, data: payload });
    else createMutation.mutate({ data: payload });
  };

  const saving = createMutation.isPending || updateMutation.isPending;
  const linesAValues = watch('lines_a');
  const linesBValues = watch('lines_b');

  // A stock-materials card: plain-language title + hint in the header with the
  // add actions beside them; empty sections stay one compact line (design C,
  // 2026-07-10 — replaces the "Section A/B" jargon blocks).
  const materialSection = (
    key: 'lines_a' | 'lines_b',
    fields: { id: string }[],
    values: BomFormValues['lines_a'] | undefined,
    title: string,
    hint: string,
    onAppend: () => void,
    onRemove: (index: number) => void,
  ) => (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border bg-secondary/40 px-3 py-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 pt-0.5">
          <button type="button" onClick={onAppend} className="text-xs font-medium text-primary hover:underline">
            + Add line
          </button>
        </div>
      </div>
      <div className="p-3">
        {fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing here yet — click "+ Add line".</p>
        ) : (
          <>
            <div className="mb-1 hidden grid-cols-[130px_1fr_120px_120px_36px] gap-1.5 text-xs font-medium text-muted-foreground sm:grid">
              <span>Type</span>
              <span className="flex items-center justify-between">
                Material
                {/* Field-level "+ Add new" — the label-row pattern used across the app. */}
                <button
                  type="button"
                  onClick={() => {
                    // Create the master matching the row the new item will land
                    // in (first material-less row), defaulting to a raw material.
                    const rows = values ?? [];
                    const targetRow = rows.find((l) => !l.raw_material_id) ?? rows[rows.length - 1];
                    setAddingMaterial({ section: key, type: targetRow?.item_type ?? 'rm' });
                  }}
                  className="text-xs font-medium normal-case text-primary hover:underline"
                >
                  + Add new
                </button>
              </span>
              <span>Quantity</span>
              <span>Unit</span>
              <span />
            </div>
            <div className="flex flex-col gap-1.5">
              {fields.map((field, index) => {
                const rmId = values?.[index]?.raw_material_id ?? '';
                const unit = rmById.get(rmId)?.unit ?? '';
                return (
                  <MaterialLineRow
                    key={field.id}
                    control={control}
                    sectionKey={key}
                    index={index}
                    optionsByType={optionsByType}
                    unit={unit}
                    onRemove={() => onRemove(index)}
                    setValue={setValue}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );

  // One free-text ingredient sub-group inside the collapsible card.
  const ingredientSection = (
    key: 'ing_scaled' | 'ing_fixed',
    fields: { id: string }[],
    title: string,
    hint: string,
    onAppend: () => void,
    onRemove: (index: number) => void,
  ) => (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <button type="button" onClick={onAppend} className="text-xs font-medium text-primary hover:underline">
          + Add ingredient
        </button>
      </div>
      {fields.length > 0 && (
        <>
          <div className="mb-1 hidden grid-cols-[1fr_120px_120px_36px] gap-1.5 text-xs font-medium text-muted-foreground sm:grid">
            <span>Ingredient</span>
            <span>Quantity</span>
            <span>Unit</span>
            <span />
          </div>
          <div className="flex flex-col gap-1.5">
            {fields.map((field, index) => (
              <IngredientRow
                key={field.id}
                control={control}
                name={key}
                index={index}
                onRemove={() => onRemove(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <CustomDrawer
      anchor="right"
      title={isEdit ? `Edit BOM — ${bom.name}` : isDuplicate ? `New version — ${seedName ?? seedFrom?.name ?? ''}` : 'Add BOM Template'}
      open={open}
      onClose={handleClose}
      drawerWidth="56rem"
      drawerPadding="0px"
    >
      {/* This drawer can stack over a host form (BOM order); React bubbles
          submit through portals, so stop it from also submitting the host. */}
      <form
        noValidate
        onSubmit={(e) => {
          e.stopPropagation();
          void handleSubmit(onSubmit)(e);
        }}
        className="flex min-h-full flex-col"
      >
        {/* Scrollable fields; the action bar below stays pinned. */}
        <div className="flex flex-1 flex-col gap-5 px-6 py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[11rem_1fr_1fr]">
            <div className="flex flex-col">
              <CustomLabel label="Type" htmlFor="output_kind" isRequired />
              <RHFSelect
                name="output_kind"
                control={control}
                items={OUTPUT_KIND_ITEMS}
                placeholder="Type"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <CustomLabel
                  label={outputKind === 'sfg' ? 'Semi-finished good' : 'Product'}
                  htmlFor={outputKind === 'sfg' ? 'sfg_id' : 'product_id'}
                  isRequired
                />
                <button
                  type="button"
                  onClick={() => setAddingOutput(true)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  + Add new
                </button>
              </div>
              {outputKind === 'sfg' ? (
                <RHFAutocomplete
                  name="sfg_id"
                  control={control}
                  options={sfgItems}
                  hasStartSearchIcon
                  placeholder={sfgItems.length ? 'Search semi-finished good…' : 'No semi-finished goods yet'}
                />
              ) : (
                <RHFAutocomplete
                  name="product_id"
                  control={control}
                  options={productItems}
                  hasStartSearchIcon
                  placeholder={productItems.length ? 'Search product…' : 'No products yet'}
                />
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <CustomLabel label="Production flow" htmlFor="flow_type" isRequired />
                <button
                  type="button"
                  onClick={() => setAddingFlow(true)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  + Add flow
                </button>
              </div>
              <RHFSelect
                name="flow_type"
                control={control}
                items={flowItems}
                placeholder={flowItems.length ? 'Select flow' : 'Loading flows…'}
              />
            </div>
            {/* <div className="flex flex-col">
              <CustomLabel label="Default batch size" htmlFor="output_qty" />
              <RHFInput name="output_qty" control={control} placeholder="e.g. 20" />
              <p className="mt-1 text-xs text-muted-foreground">
                Used when a BOM order leaves Batch Size blank.
              </p>
            </div> */}
          </div>

          {materialSection(
            'lines_a',
            linesA.fields,
            linesAValues,
            'Materials — scale with batch size',
            'Stock materials — the quantity is multiplied by the batch size (e.g. 1.2 kg × batch 20 = 24 kg reserved).',
            () => linesA.append(emptyBomLine()),
            (i) => linesA.remove(i),
          )}
          {materialSection(
            'lines_b',
            linesB.fields,
            linesBValues,
            'Materials — fixed per batch',
            'Stock materials deducted AS-IS on every batch — 5 kg stays 5 kg for any batch size.',
            () => linesB.append(emptyBomLine()),
            (i) => linesB.remove(i),
          )}

          {/* Free-text ingredients, collapsed until used (design C). */}
          <div className="overflow-hidden rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setIngOpen((o) => !o)}
              aria-expanded={ingOpen}
              className="flex w-full items-center justify-between gap-2 bg-secondary/40 px-3 py-2 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">Other ingredients (not stock-tracked)</p>
                <p className="text-xs text-muted-foreground">
                  Free-text items like juice — shown on the recipe, never reserved from stock.
                  {!ingOpen && ingScaled.fields.length + ingFixed.fields.length > 0
                    ? ` ${ingScaled.fields.length + ingFixed.fields.length} line(s).`
                    : ''}
                </p>
              </div>
              <ChevronDown
                aria-hidden
                className={`size-4 shrink-0 text-muted-foreground transition-transform ${ingOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {ingOpen && (
              <div className="flex flex-col gap-4 border-t border-border p-3">
                {ingredientSection(
                  'ing_scaled',
                  ingScaled.fields,
                  'Scale with batch size',
                  'Quantity multiplies with the batch size.',
                  () => ingScaled.append(emptyIngredientLine()),
                  (i) => ingScaled.remove(i),
                )}
                {ingredientSection(
                  'ing_fixed',
                  ingFixed.fields,
                  'Fixed per batch',
                  'Same quantity for any batch size.',
                  () => ingFixed.append(emptyIngredientLine()),
                  (i) => ingFixed.remove(i),
                )}
              </div>
            )}
          </div>
        </div>

        {submitError && (
          <div className="mx-6 mb-2 shrink-0 rounded-md border border-destructive-10 bg-destructive-01 p-3 text-xs font-medium text-destructive">
            {submitError}
          </div>
        )}

        {/* Pinned action bar — always visible while the form scrolls. */}
        <div className="sticky bottom-0 shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
          <CustomButton type="button" variant="outline" onClick={handleClose}>
            Cancel
          </CustomButton>
          <CustomButton type="submit" variant="primary" loading={saving}>
            {isEdit ? 'Save changes' : isDuplicate ? 'Create version' : 'Add BOM'}
          </CustomButton>
        </div>
      </form>

      {/* Inline master creation without leaving the BOM. */}
      <ProductDrawer
        open={(addingOutput && outputKind !== 'sfg') || addingMaterial?.type === 'fg'}
        product={null}
        onClose={() => {
          setAddingOutput(false);
          setAddingMaterial(null);
        }}
        onSaved={onProductSaved}
      />
      <SemiFinishedGoodDrawer
        open={(addingOutput && outputKind === 'sfg') || addingMaterial?.type === 'sf'}
        sfg={null}
        onClose={() => {
          setAddingOutput(false);
          setAddingMaterial(null);
        }}
        onSaved={onSfgSaved}
      />
      <RawMaterialDrawer
        open={addingMaterial?.type === 'rm'}
        material={null}
        onClose={() => setAddingMaterial(null)}
        onSaved={onRmSaved}
      />
      <ProductionFlowDrawer
        open={addingFlow}
        flow={null}
        onClose={() => setAddingFlow(false)}
        onSaved={(saved) => {
          void refetchFlows();
          if (saved) setValue('flow_type', saved.code);
        }}
      />
    </CustomDrawer>
  );
}
