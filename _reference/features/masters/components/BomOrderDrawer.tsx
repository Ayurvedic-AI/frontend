/**
 * BOM Order create/edit drawer (feature 037).
 * Create: searchable autocomplete (20 records, debounced search) → auto-populate lines → batch fields.
 * Edit: template locked (shown as disabled text), only batch fields editable.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { CustomLabel } from '../../../common/custom-label';
import { RHFInput, RHFAutocomplete, RHFDatePicker } from '../../../common/rhf-wrappers';
import { useToast } from '../../../common/common-snackbar';
import { errorMessage, errorViolations, successMessage } from '../../../utils/api-messages';
import {
  useAdminCreateBomOrder,
  useAdminSetBomOrderStatus,
  useAdminUpdateBomOrder,
  getAdminListBomsQueryKey,
} from '../../../sdk/inventory';
import { useBoms } from '../hooks/useBoms';
import { bomsQueryOptions, type BomRow } from '../api/boms';
import { BomDrawer } from './BomDrawer';
import { BomOrderAllocationsPanel } from './bom-order-allocations-panel';
import { useBomOrderForm, bomOrderFormDefaults, type BomOrderFormValues } from '../hooks/useCreateBomOrderForm';
import { useBomOrderFeasibility } from '../hooks/use-bom-order-feasibility';
import type { BomOrderRow } from '../api/bom-orders';
import { cn } from '../../../lib/cn';
import { useProducts } from '../hooks/useProducts';
import { useMaterialCategoryByName } from '../hooks/use-rm-category-map';
import { useSemiFinishedGoods } from '../hooks/useSemiFinishedGoods';
import { useAutoBatchNo } from '../../inventory/hooks/use-grn-line-defaults';
import { useStores } from '../../inventory/hooks/useStores';

/** Strip a trailing " (vN)" version tag from a BOM name (mirrors BomsPage). */
const stripVersionTag = (name: string) => name.replace(/\s*\(v\d+\)\s*$/i, '').trim();
/** Parse the version number from a name's trailing " (vN)" (1 when untagged). */
const parseVersionTag = (name: string) => {
  const m = name.match(/\(v(\d+)\)\s*$/i);
  return m ? Number(m[1]) : 1;
};
/** ROUND_HALF_UP to 3 decimals (matches the scaled-preview math). */
const round3 = (n: number) => Math.round((n + Number.EPSILON) * 1000) / 1000;
/** Display a quantity with at most 2 decimals (trailing zeros dropped); '—' for null. */
const fmt2 = (n: number | null | undefined) =>
  n == null ? '—' : String(Math.round(n * 100) / 100);

interface ShortfallItem {
  /** Already "Name (Category)" or plain "Name" — resolved server-side. */
  label: string;
  /** Matched the "no inventory stock record" violation shape. */
  noStock?: boolean;
  /** undefined ⇒ not a need/have shortfall (no-stock or free-form violation). */
  need?: number;
  have?: number;
}

/**
 * Each stock shortfall (bom_order_reservation_service) arrives as its own entry in
 * the error's `violations` list, one material per string, e.g. "Turmeric Powder
 * (Spices): need 46.000, have 0". Parse the raw (up to 3dp) amounts back out so the
 * drawer can render a clear, 2-decimal bullet with a plain-language "short by" instead
 * of the raw-precision string as-is.
 */
const SHORTFALL_ITEM_RE = /^(.+): (?:need ([\d.]+), have ([\d.]+)|no inventory stock record)$/;
const parseShortfallItem = (raw: string): ShortfallItem => {
  const m = raw.match(SHORTFALL_ITEM_RE);
  // Free-form violations (e.g. the unit-mismatch message) render verbatim.
  if (!m) return { label: raw };
  return {
    label: m[1],
    noStock: m[2] == null,
    need: m[2] != null ? Number(m[2]) : undefined,
    have: m[3] != null ? Number(m[3]) : undefined,
  };
};

export interface BomOrderDrawerProps {
  open: boolean;
  order?: BomOrderRow | null;
  onClose: () => void;
  onSaved: () => void;
}

export function BomOrderDrawer({ open, order, onClose, onSaved }: BomOrderDrawerProps) {
  const { toast } = useToast();
  const isEdit = order != null;

  const { control, handleSubmit, reset, watch, setValue, getValues } = useBomOrderForm(order);
  const selectedBomId = watch('bom_id');

  // Searchable template dropdown: 20 records, debounced search
  const [bomSearch, setBomSearch] = useState('');
  const { boms, isLoading: bomsLoading } = useBoms({
    search: bomSearch,
    page: 0,
    pageSize: 20,
    sort: 'name',
    activeOnly: true,
  });

  // Edit mode: resolve the order's LIVE BOM template (by id) so the scaled preview and
  // stock advisory mirror what the backend reserves — reserve_for_order scales the live
  // template (BomLine) × batch_size, not the order's snapshot lines. activeOnly:false so
  // an order on a since-deactivated template still resolves. Disabled in create mode.
  const { boms: editBomList } = useBoms(
    { search: order?.bom_name ?? '', page: 0, pageSize: 20, sort: 'name', activeOnly: false },
    { enabled: isEdit },
  );
  const editBom = isEdit ? (editBomList.find((b) => b.id === order?.bom_id) ?? null) : null;

  // Auto-generate the finished-goods batch number when a template is picked
  // (same `name-FY-month-day-count` generator the GRN drawer uses); editable.
  const autoBatchNo = useAutoBatchNo();
  const autoBatchFor = useRef<string | null>(null);

  const { products } = useProducts();
  const categoryByProductId = useMemo(
    () => new Map(products.map((p) => [p.id, p.category])),
    [products],
  );
  // Shelf life (months) of the template's output good — FG (products master)
  // or SFG (semi-finished goods master) — drives the Exp Date prefill.
  const { semiFinishedGoods } = useSemiFinishedGoods();
  const shelfMonthsByProductId = useMemo(
    () => new Map(products.map((p) => [p.id, p.shelf_life_months])),
    [products],
  );
  const shelfMonthsBySfgId = useMemo(
    () => new Map(semiFinishedGoods.map((s) => [s.id, s.shelf_life_months])),
    [semiFinishedGoods],
  );

  const bomOptions = useMemo(
    () =>
      boms.map((b) => {
        const cat = b.product_id != null ? categoryByProductId.get(b.product_id) : undefined;
        const v = parseVersionTag(b.name);
        const base = stripVersionTag(b.name);
        return {
          key: String(b.id),
          value: `${base}${cat ? ` - ${cat}` : ''}${v > 1 ? ` (v${v})` : ''}`,
        };
      }),
    [boms, categoryByProductId],
  );

  // Keep selected BOM data stable even when search changes and the item
  // disappears from the current boms list. Only clear when the field is emptied.
  // State is adjusted during render (the React-endorsed alternative to a
  // setState-in-effect cascade); each branch is guarded so it sets at most once
  // per transition.
  const [selectedBomData, setSelectedBomData] = useState<typeof boms[0] | null>(null);
  const [trackedBomId, setTrackedBomId] = useState('');

  // Clear the sticky preview + search when the drawer (re)opens.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTrackedBomId('');
      setSelectedBomData(null);
      setBomSearch('');
    }
  }

  // Track the selected BOM as the id changes; stay sticky while the list reloads.
  if (!selectedBomId) {
    if (trackedBomId !== '') {
      setTrackedBomId('');
      setSelectedBomData(null);
    }
  } else if (selectedBomId !== trackedBomId) {
    const found = boms.find((b) => String(b.id) === selectedBomId);
    if (found) {
      setTrackedBomId(selectedBomId);
      setSelectedBomData(found);
    }
    // If not found yet (list still loading), keep whatever was there before.
  }

  // Re-seed the form when the drawer opens or the target row changes.
  // reset() is RHF state (not React setState), so it stays in an effect.
  useEffect(() => {
    if (open) reset(bomOrderFormDefaults(order));
  }, [open, order, reset]);

  // Inline "add BOM template from the order" (label-row pattern): the saved
  // template lands in the picker's blank-search page, auto-selects, and seeds
  // the sticky preview directly (create mode only — edit locks the template).
  const [addingBom, setAddingBom] = useState(false);
  const qc = useQueryClient();
  const onBomSaved = (bom?: BomRow) => {
    if (bom) {
      setBomSearch('');
      const blankSearchKey = bomsQueryOptions({
        search: '',
        page: 0,
        pageSize: 20,
        sort: 'name',
        activeOnly: true,
      }).queryKey;
      qc.setQueryData(blankSearchKey, (prev) => {
        if (prev?.status !== 200) return prev;
        return {
          ...prev,
          data: { ...prev.data, results: [...prev.data.results, bom], count: prev.data.count + 1 },
        };
      });
      setValue('bom_id', String(bom.id));
      setTrackedBomId(String(bom.id));
      setSelectedBomData(bom);
    }
    // Prefix-invalidate every boms list variant (search pages, edit resolver).
    void qc.invalidateQueries({ queryKey: [getAdminListBomsQueryKey()[0]] });
  };

  const createMutation = useAdminCreateBomOrder({
    mutation: {
      onSuccess: (response) => {
        toast({ severity: 'success', message: successMessage(response, 'BOM order created.') });
        reset(bomOrderFormDefaults());
        onSaved();
        onClose();
      },
      onError: (err) => toast({ severity: 'error', message: errorMessage(err) }),
    },
  });

  const updateMutation = useAdminUpdateBomOrder({
    mutation: {
      onError: (err) => toast({ severity: 'error', message: errorMessage(err) }),
    },
  });

  // Edit-mode "Create order" on a draft: save, then confirm (reserves stock).
  const confirmMutation = useAdminSetBomOrderStatus({
    mutation: { onError: (err) => toast({ severity: 'error', message: errorMessage(err) }) },
  });

  useEffect(() => {
    if (!open || isEdit || !selectedBomData) return;
    const key = String(selectedBomData.id);
    if (autoBatchFor.current === key) return;
    autoBatchFor.current = key;
    // Prefill Batch Size from the template's default (bom.output_qty) so the
    // advisory and the field agree; the user can still overtype it.
    if (selectedBomData.output_qty != null && !getValues('batch_size')) {
      setValue('batch_size', String(selectedBomData.output_qty), { shouldDirty: false });
    }
    void autoBatchNo(selectedBomData.product_name ?? selectedBomData.name, []).then((batchNo) => {
      setValue('batch_no', batchNo, { shouldDirty: false });
    });
  }, [open, isEdit, selectedBomData, autoBatchNo, setValue, getValues]);

  // Dates appear only once a template is picked: Mfg = today, Exp = today +
  // the output good's shelf life from its master (FG or SFG). No shelf life on
  // the master → Exp stays blank for the user to fill. Separate from the
  // batch-no effect (which runs once per template) so a late-loading master
  // list can still fill Exp; user-typed values are never overwritten.
  useEffect(() => {
    if (!open || isEdit || !selectedBomData) return;
    if (!getValues('mfg_date')) {
      setValue('mfg_date', dayjs().format('YYYY-MM-DD'), { shouldDirty: false });
    }
    const shelfMonths =
      selectedBomData.product_id != null
        ? shelfMonthsByProductId.get(selectedBomData.product_id)
        : selectedBomData.semi_finished_good_id != null
          ? shelfMonthsBySfgId.get(selectedBomData.semi_finished_good_id)
          : null;
    if (shelfMonths != null && shelfMonths > 0 && !getValues('exp_date')) {
      setValue('exp_date', dayjs().add(shelfMonths, 'month').format('YYYY-MM-DD'), { shouldDirty: false });
    }
  }, [open, isEdit, selectedBomData, setValue, getValues, shelfMonthsByProductId, shelfMonthsBySfgId]);

  // RHFDatePicker returns full ISO strings; backend date fields need YYYY-MM-DD only.
  const toDate = (v: string | undefined) => v?.split('T')[0] || undefined;

  const onSubmit = (data: BomOrderFormValues, opts: { draft?: boolean; confirm?: boolean } = {}) => {
    const payload = {
      bom_id: Number(data.bom_id),
      batch_no: data.batch_no,
      batch_size: data.batch_size ? Number(data.batch_size) : undefined,
      mfg_date: toDate(data.mfg_date),
      exp_date: toDate(data.exp_date),
    };

    if (isEdit) {
      const { batch_no, batch_size, mfg_date, exp_date } = payload;
      const body = { batch_no, batch_size, mfg_date, exp_date };
      if (opts.confirm) {
        // Save first, then confirm — confirming reserves raw material
        // (backend 422 on shortfall keeps the drawer open via onError).
        void (async () => {
          try {
            await updateMutation.mutateAsync({ orderUuid: order.uuid as string, data: body });
            await confirmMutation.mutateAsync({
              orderUuid: order.uuid as string,
              data: { status: 'CONFIRMED' },
            });
            toast({ severity: 'success', message: 'Order confirmed — raw material reserved.' });
            onSaved();
            onClose();
          } catch {
            // onError already toasted.
          }
        })();
        return;
      }
      void (async () => {
        try {
          const response = await updateMutation.mutateAsync({
            orderUuid: order.uuid as string,
            data: body,
          });
          toast({ severity: 'success', message: successMessage(response, 'BOM order updated.') });
          onSaved();
          onClose();
        } catch {
          // onError already toasted.
        }
      })();
    } else {
      // Advisory only (067): the backend is the authoritative stock gate (returns 422 +
      // surfaces via onError). Drafts hold nothing — no stock gate at all.
      if (!opts.draft && feasibility.isLoading) {
        toast({ severity: 'info', message: 'Checking raw-material stock — please try again in a moment.' });
        return;
      }
      createMutation.mutate({ data: { ...payload, draft: Boolean(opts.draft) } });
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;
  const ingredientLines = isEdit ? (order.lines ?? []) : (selectedBomData?.lines ?? []);

  // Create-time raw-material feasibility (066): scaled preview quantities + an advisory
  // stock preview. In edit mode no template is selected (selectedBomData stays null),
  // so the hook no-ops and the preview does not apply in edit mode (FR-010).
  const batchSizeValue = watch('batch_size');
  // Create → the autocomplete selection; edit → the resolved live template (above).
  const effectiveBom = isEdit ? editBom : selectedBomData;
  const feasibility = useBomOrderFeasibility({
    bom: effectiveBom ?? undefined,
    batchSize: batchSizeValue,
    // Edit: credit this order's own held reservation back into availability so a
    // batch-size change isn't falsely flagged short (backend releases it first).
    creditAllocations: isEdit ? (order?.allocations ?? undefined) : undefined,
  });
  // Scale the preview (create AND edit) once a positive batch size is entered; blank ⇒
  // unscaled recipe qty. The multiplication is a pure display calc applied to EVERY
  // numeric line (linked or not) — independent of the advisory stock check, which only
  // covers raw-material-linked lines. Edit recalculates live as Batch Size changes.
  const batchSizeNum = Number(batchSizeValue);
  const showScaled = Number.isFinite(batchSizeNum) && batchSizeNum > 0;
  const stockShortfalls = feasibility.shortfalls;
  // Per-line available stock for the preview (#235) — sized decisions need to see
  // what's on hand next to each ingredient. Keyed by the BOM line id.
  const availableByLineId = new Map(feasibility.lines.map((l) => [l.lineId, l] as const));
  // Edit mode renders the ORDER's snapshot lines, whose ids differ from the
  // template line ids feasibility is keyed by (and snapshots carry no
  // raw_material_id) — so match by ingredient name there instead.
  const availableByName = new Map(
    feasibility.lines.map((l) => [l.rmName.trim().toLowerCase(), l] as const),
  );
  // Category chip per preview row — shared with the read-only detail drawer.
  const categoryByName = useMaterialCategoryByName(open);

  // Advisory FEFO "stock to pick" per linked material — tells staff which batch/store to
  // pull; the backend reservation is authoritative on submit. Shown in create and edit.
  const stockPicks = feasibility.lines.filter((l) => l.picks.length > 0);
  // Store code → name so picks show a readable store name instead of e.g. "STR-0002".
  const { stores } = useStores();
  const storeNameByCode = new Map(stores.map((s) => [s.store_code, s.store_name] as const));
  // Backend error to echo inline at the drawer bottom (in addition to the toast). `violations`
  // carries the per-material shortfall breakdown (already name+category, resolved server-side).
  const submitMutationError = !isEdit
    ? (createMutation.isError ? createMutation.error : null)
    : (updateMutation.isError ? updateMutation.error : null);
  const submitError = submitMutationError ? errorMessage(submitMutationError) : null;
  const submitViolations = submitMutationError ? errorViolations(submitMutationError) : [];

  return (
    <CustomDrawer
      anchor="right"
      title={isEdit ? `Edit BOM Order — ${order.batch_no}` : 'Create BOM Order'}
      open={open}
      onClose={() => { reset(bomOrderFormDefaults(order)); createMutation.reset(); updateMutation.reset(); onClose(); }}
      drawerWidth="52rem"
    >
      <form noValidate onSubmit={handleSubmit((d) => onSubmit(d))} className="flex h-full flex-col">
        {/* Scrollable fields; the action bar below stays pinned. */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-0.5">

        {/* Template + Batch Size — one row (066 US1) */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {isEdit ? (
            <div className="flex flex-col gap-1">
              <CustomLabel label="BOM Template" htmlFor="bom_id_display" />
              <div className="flex h-10 items-center rounded-md border border-border bg-muted/30 px-3 text-sm text-muted-foreground">
                {order.bom_name ?? `Template #${order.bom_id}`}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <CustomLabel label="BOM Template" htmlFor="bom_id" isRequired />
                <button
                  type="button"
                  onClick={() => setAddingBom(true)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  + Add new
                </button>
              </div>
              <RHFAutocomplete
                name="bom_id"
                control={control}
                placeholder="Search template by name…"
                options={bomOptions}
                loading={bomsLoading}
                loadingText="Searching…"
                onDebounceCall={setBomSearch}
                onInputEmpty={() => {
                  setBomSearch('');
                  setValue('bom_id', ''); // clears the field → hides preview
                  // Dates were derived from this template's output good —
                  // clear them so the next pick prefills fresh.
                  setValue('mfg_date', '');
                  setValue('exp_date', '');
                }}
                debounceMs={400}
                hasStartSearchIcon
              />
              <p className="text-xs text-muted-foreground">
                Showing first 20 results. Type to search more.
              </p>
            </div>
          )}
          <RHFInput
            name="batch_size"
            control={control}
            label="Batch Size"
            required
            placeholder="e.g. 20"
          />
        </div>

        {/* Read-only ingredient preview */}
        {ingredientLines.length > 0 && (
          <div className="rounded-md border border-border bg-muted/20 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Ingredient Lines (read-only)
              {showScaled ? <span className="font-normal normal-case"> — quantities multiplied by batch size {batchSizeNum}</span> : ''}
            </p>
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-1 text-left">Material</th>
                    <th className="pb-1 text-right">Quantity</th>
                    <th className="pb-1 pl-3 text-left">Unit</th>
                    <th className="pb-1 pl-3 text-right">Available</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredientLines.map((line, idx) => {
                    // Scaled quantity (066/067): multiply EVERY numeric line by batch size for
                    // display (recipe_qty × batch_size). Section headers + non-numeric weights
                    // (e.g. "Q.S.") are shown unchanged.
                    const rawQty = line.quantity != null ? String(line.quantity).trim() : '';
                    const lineQty = rawQty === '' ? NaN : Number(rawQty);
                    // FIXED sections keep their quantity on any batch size —
                    // only scaled sections multiply (mirrors the reservation).
                    const isFixed =
                      line.section === 'FIXED_MATERIAL' || line.section === 'INGREDIENT_FIXED';
                    // "Other ingredients" sections are free text (e.g. juice) —
                    // they link to no material, so nothing is reserved for them.
                    const isFreeText =
                      line.section === 'INGREDIENT_SCALED' || line.section === 'INGREDIENT_FIXED';
                    const canScale =
                      showScaled &&
                      line.section !== 'SECTION_HEADER' &&
                      !isFixed &&
                      Number.isFinite(lineQty);
                    const scaledQty = canScale ? round3(lineQty * batchSizeNum) : null;
                    return (
                      <tr
                        key={idx}
                        className={cn(
                          'border-b border-border/50',
                          line.section === 'SECTION_HEADER' && 'bg-muted/40 font-semibold',
                        )}
                      >
                        <td className="py-0.5">
                          <span className="align-middle">{line.ingredient_name ?? '—'}</span>
                          {line.section !== 'SECTION_HEADER' && (
                            <>
                              {categoryByName.get((line.ingredient_name ?? '').trim().toLowerCase()) && (
                                <span className="ml-1.5 inline-block whitespace-nowrap rounded-full bg-secondary px-1.5 py-px align-middle text-[10px] font-medium text-muted-foreground">
                                  {categoryByName.get((line.ingredient_name ?? '').trim().toLowerCase())}
                                </span>
                              )}
                              {/* Free-text "other ingredients" link to no material —
                                  nothing is reserved and Available is always "—".
                                  Neutral styling on purpose: this is what the line
                                  IS, not a shortage. */}
                              {isFreeText && (
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
                        <td className="py-0.5 text-right tabular-nums">
                          {scaledQty != null ? (
                            <>
                              {fmt2(scaledQty)}
                              <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                                ({fmt2(lineQty)} × {batchSizeNum})
                              </span>
                            </>
                          ) : rawQty === '' ? (
                            '—'
                          ) : Number.isFinite(lineQty) ? (
                            fmt2(lineQty)
                          ) : (
                            rawQty
                          )}
                        </td>
                        <td className="py-0.5 pl-3 text-muted-foreground">{line.unit ?? ''}</td>
                        <td className="py-0.5 pl-3 text-right tabular-nums">
                          {(() => {
                            if (line.section === 'SECTION_HEADER') return null;
                            const fl = isEdit
                              ? availableByName.get((line.ingredient_name ?? '').trim().toLowerCase())
                              : line.id != null
                                ? availableByLineId.get(line.id)
                                : undefined;
                            if (!fl || fl.available == null) return <span className="text-muted-foreground">—</span>;
                            const short = fl.status === 'short';
                            return (
                              <span className={short ? 'font-medium text-destructive' : 'text-positive-70'}>
                                {fmt2(fl.available)}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stock to pick (067) — advisory FEFO preview in create mode so staff know which batch/store to pull. */}
        {stockPicks.length > 0 && (
          <div className="rounded-md border border-border bg-muted/20 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Stock to pick
              <span className="font-normal normal-case"> — suggested picking order (earliest expiry first); confirmed on save</span>
            </p>
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-1 text-left">Material</th>
                    <th className="pb-1 text-left">Batch</th>
                    <th className="pb-1 text-left">Store</th>
                    <th className="pb-1 pl-3 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {stockPicks.flatMap((l) =>
                    l.picks.map((p, i) => (
                      <tr key={`${l.lineId}-${i}`} className="border-b border-border/50">
                        <td className="py-0.5">{i === 0 ? l.rmName : ''}</td>
                        <td className="py-0.5">{p.batchNo}</td>
                        <td className="py-0.5">{storeNameByCode.get(p.storeCode) ?? p.storeCode}</td>
                        <td className="py-0.5 pl-3 text-right tabular-nums">
                          {fmt2(p.qty)} {l.unit ?? ''}
                        </td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Allocated stock panel (067) — read-only; edit mode only when allocations
            exist. Same shared panel as the detail/manufacturing drawers. */}
        {isEdit && (order?.allocations ?? []).some((a) => a.status !== 'RELEASED') && (
          <div className="rounded-md border border-border bg-muted/20 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Allocated stock
            </p>
            {/* RELEASED rows from a cancelled run are hidden — they'd double-list
                the re-reserved stock. */}
            <BomOrderAllocationsPanel
              allocations={(order?.allocations ?? []).filter((a) => a.status !== 'RELEASED')}
            />
          </div>
        )}

        {/* Batch No (Batch Size now sits beside the template above) */}
        <RHFInput
          name="batch_no"
          control={control}
          label="Batch No"
          required
          uppercase
          placeholder="e.g. T-AP-26/27-01"
        />
        {/* Blank until a template (output good) is chosen — picking one
            prefills Mfg = today, Exp = today + master shelf life. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <RHFDatePicker name="mfg_date" control={control} label="Mfg Date" placeholder="Mfg Date" />
          <RHFDatePicker name="exp_date" control={control} label="Exp Date" placeholder="Exp Date" />
        </div>
        </div>

        {/* Stock shortfall advisory alert (066 US3) — advisory only; backend confirms on submit. */}
        {stockShortfalls.length > 0 && (
          <div className="mt-3 shrink-0 rounded-md border border-destructive-10 bg-destructive-01 p-3 text-xs text-destructive">
            <p className="mb-1 font-semibold">Likely short — backend will confirm on submit</p>
            <ul className="space-y-0.5">
              {stockShortfalls.map((s) =>
                s.status === 'unit_mismatch' ? (
                  <li key={s.lineId}>
                    {s.rmName}: recipe unit '{s.unit}' does not match stock unit '{s.stockUom}'
                  </li>
                ) : (
                  <li key={s.lineId}>
                    {/* required/available are in the STOCK unit (converted when the line unit differs). */}
                    {s.rmName}: need {fmt2(s.required)} {s.stockUom ?? s.unit ?? ''}, have {fmt2(s.available)}{' '}
                    {s.stockUom ?? s.unit ?? ''}
                  </li>
                ),
              )}
            </ul>
            <p className="mt-1">The server will reject if stock is insufficient.</p>
          </div>
        )}

        {/* Backend error echoed inline at the drawer bottom (also shown as a toast). Each shortfall
            arrives pre-resolved to "Name (Category)" via `violations` (bom_order_reservation_service);
            render it as its own bullet with amounts rounded to 2 decimals and a plain-language
            "short by" so non-technical staff can act on it. */}
        {submitError && (
          <div className="mt-3 shrink-0 rounded-md border border-destructive-10 bg-destructive-01 p-3 text-xs font-medium text-destructive">
            <p>{submitError}</p>
            {submitViolations.length > 0 && (
              <ul className="mt-1 list-disc space-y-0.5 pl-4 font-normal">
                {submitViolations.map((raw, i) => {
                  const item = parseShortfallItem(raw);
                  return (
                    <li key={i}>
                      {item.need != null
                        ? `${item.label}: need ${fmt2(item.need)}, have ${fmt2(item.have)} — short by ${fmt2(item.need - (item.have ?? 0))}`
                        : item.noStock
                          ? `${item.label}: no stock record found for this material`
                          : item.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Pinned action bar — always visible while the form scrolls. */}
        <div className="mt-3 flex shrink-0 justify-end gap-3 border-t border-border pt-3">
          <CustomButton
            type="button"
            variant="outline"
            onClick={() => { reset(bomOrderFormDefaults(order)); createMutation.reset(); updateMutation.reset(); onClose(); }}
          >
            Cancel
          </CustomButton>
          {!isEdit && (
            <CustomButton
              type="button"
              variant="outline"
              loading={saving}
              onClick={handleSubmit((d) => onSubmit(d, { draft: true }))}
            >
              Save as draft
            </CustomButton>
          )}
          {isEdit && order.status === 'DRAFT' && (
            <CustomButton
              type="button"
              variant="outline"
              loading={saving}
              onClick={handleSubmit((d) => onSubmit(d))}
            >
              Save draft
            </CustomButton>
          )}
          {isEdit && order.status === 'DRAFT' ? (
            <CustomButton
              type="button"
              variant="primary"
              loading={saving || confirmMutation.isPending}
              onClick={handleSubmit((d) => onSubmit(d, { confirm: true }))}
            >
              Create Order
            </CustomButton>
          ) : (
            <CustomButton
              type="submit"
              variant="primary"
              loading={saving || (!isEdit && feasibility.isLoading)}
            >
              {isEdit ? 'Save changes' : 'Create Order'}
            </CustomButton>
          )}
        </div>
      </form>

      {/* Inline BOM-template creation without leaving the order. */}
      <BomDrawer
        open={addingBom}
        bom={null}
        onClose={() => setAddingBom(false)}
        onSaved={onBomSaved}
      />
    </CustomDrawer>
  );
}
