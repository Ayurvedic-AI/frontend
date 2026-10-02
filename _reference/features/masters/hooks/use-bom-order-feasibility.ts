import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getAdminListStockQueryOptions,
  getAdminListRawMaterialsQueryOptions,
} from '../../../sdk/inventory';
import type {
  BomListItem,
  BomOrderAllocationOut,
  StockList,
  StockListItem,
  RawMaterialListResponse,
  RawMaterialListItem,
} from '../../../sdk/schemas';
import { uomFactor } from '../../../utils/uom';

export interface FeasibilityLine {
  /** Source BOM line id — lets the preview look its scaled quantity up by row. */
  lineId: number;
  /** Resolved raw-material code (== inventory material_code); null when unmapped. */
  rmCode: string | null;
  rmName: string;
  unit: string | null;
  /** Parsed recipe quantity; null when the BOM weight is non-numeric (e.g. "Q.S."). */
  recipeQty: number | null;
  /** round3(recipeQty × effectiveBatchSize) — plain multiply (066 D1); null when not scalable. */
  required: number | null;
  /** Σ(quantity − reserved) for rmCode across ALL stores (066 D2); null while loading. */
  available: number | null;
  sufficient: boolean;
  status: 'ok' | 'short' | 'unmapped' | 'unit_mismatch';
  /** Stock UOM when it conflicts with the line unit and can't be converted. */
  stockUom?: string | null;
  /**
   * Advisory FEFO pick (earliest-expiry first, across all stores) that would cover
   * `required` — tells staff which batch/store to pull. Backend FEFO is authoritative.
   */
  picks: { batchNo: string; storeCode: string; qty: number }[];
}

export interface FeasibilitySummary {
  lines: FeasibilityLine[];
  /** Lines that resolve to a real shortfall (mapped + scalable + available < required). */
  shortfalls: FeasibilityLine[];
  /** True (after load) when at least one line is short. ADVISORY only — the drawer no longer hard-blocks on this; the backend 422 is the real gate. Kept for the inline "likely short" hint. */
  blocked: boolean;
  isLoading: boolean;
  /** A template is selected so a feasibility check is meaningful. */
  ready: boolean;
}

interface Params {
  /** The selected BOM template (create) or the order's resolved template (edit). */
  bom?: BomListItem;
  /** Batch size as typed in the form (string). */
  batchSize?: string;
  /**
   * The order's own current reservations (edit mode). Each HELD allocation's quantity is
   * credited back into available stock for its batch/store — on a batch-size edit the
   * backend RELEASES this order's hold before re-reserving, so without this credit the
   * advisory would falsely warn "short" when merely re-editing an order that already
   * holds its stock. Omit (create mode) → no credit applied.
   */
  creditAllocations?: BomOrderAllocationOut[];
}

/** ROUND_HALF_UP to 3 decimals (mirrors how scaled quantities are presented elsewhere). */
function round3(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

/**
 * Create-time BOM-order raw-material feasibility: per recipe line, the required
 * quantity (recipe weight × batch size, plain multiply — 066 D1) versus the
 * available consumable stock (on-hand − reserved) summed across ALL stores
 * (066 D2). This client check is ADVISORY (067): a BOM order's create now reserves
 * stock server-side and returns 422 on shortfall, so the backend is the authoritative
 * gate; this hook drives the scaled preview and a non-blocking "likely short" hint.
 * Frontend-only, reuses the `material_code`
 * bridge (svm-be `_sync_inventory_material` keeps `RawMaterial.code == Material.material_code`).
 * Self-contained — does not import the manufacturing hooks (Principle IV).
 */
export function useBomOrderFeasibility({ bom, batchSize, creditAllocations }: Params): FeasibilitySummary {
  const ready = Boolean(bom);

  // Credit map: this order's HELD reservation per batch/store, keyed by
  // material_code|batch_no|store_code. Added back to free stock below so the
  // edit-mode advisory reflects what the backend sees after it releases this hold.
  const creditByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of creditAllocations ?? []) {
      if (a.status !== 'HELD') continue;
      const key = `${a.material_code}|${a.batch_no}|${a.store_code}`;
      map.set(key, (map.get(key) ?? 0) + Number(a.quantity));
    }
    return map;
  }, [creditAllocations]);

  const rmQuery = useQuery(
    // Backend caps `limit` at 100 (le=100) — 500 was silently 422ing this query.
    getAdminListRawMaterialsQueryOptions({ limit: 100 }, { query: { enabled: ready } }),
  );
  const rmData = (rmQuery.data as { data?: RawMaterialListResponse } | undefined)?.data;

  // raw_material_id → code (== inventory material_code).
  const codeById = useMemo(() => {
    const map = new Map<number, string>();
    for (const rm of (rmData?.results ?? []) as RawMaterialListItem[]) {
      map.set(rm.id, rm.code);
    }
    return map;
  }, [rmData]);

  const stockQuery = useQuery(
    getAdminListStockQueryOptions(
      { status: 'available', limit: 100 },
      { query: { enabled: ready } },
    ),
  );
  const stockData = (stockQuery.data as { data?: StockList } | undefined)?.data;

  // material_code → stock UOM (for unit reconciliation with the recipe line unit).
  const uomByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of (stockData?.items ?? []) as StockListItem[]) {
      if (!map.has(it.material_code)) map.set(it.material_code, it.uom);
    }
    return map;
  }, [stockData]);

  // Σ(on-hand − reserved + this-order's-own-hold) per material_code, summed across every store.
  const availableByCode = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of (stockData?.items ?? []) as StockListItem[]) {
      const credit = creditByKey.get(`${it.material_code}|${it.batch_no}|${it.store_code}`) ?? 0;
      const free = Number(it.quantity) - Number(it.reserved_quantity) + credit;
      map.set(it.material_code, (map.get(it.material_code) ?? 0) + free);
    }
    return map;
  }, [stockData, creditByKey]);

  // Per-material available batches across ALL stores, FEFO-ordered (earliest expiry
  // first, nulls last; batch_no as a stable tiebreak) — drives the advisory "stock to
  // pick" preview. Mirrors the backend FEFO order (which also tiebreaks by batch id).
  const rowsByCode = useMemo(() => {
    const map = new Map<string, { batchNo: string; storeCode: string; available: number; expiry: string | null }[]>();
    for (const it of (stockData?.items ?? []) as StockListItem[]) {
      const credit = creditByKey.get(`${it.material_code}|${it.batch_no}|${it.store_code}`) ?? 0;
      const available = Number(it.quantity) - Number(it.reserved_quantity) + credit;
      if (!(available > 0)) continue;
      const arr = map.get(it.material_code) ?? [];
      arr.push({ batchNo: it.batch_no, storeCode: it.store_code, available, expiry: it.expiry_date });
      map.set(it.material_code, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        if (a.expiry == null && b.expiry == null) return a.batchNo < b.batchNo ? -1 : 1;
        if (a.expiry == null) return 1; // nulls last
        if (b.expiry == null) return -1;
        if (a.expiry !== b.expiry) return a.expiry < b.expiry ? -1 : 1;
        return a.batchNo < b.batchNo ? -1 : 1;
      });
    }
    return map;
  }, [stockData, creditByKey]);

  return useMemo<FeasibilitySummary>(() => {
    const isLoading = ready && (rmQuery.isPending || stockQuery.isPending);

    if (!ready || !bom) {
      return { lines: [], shortfalls: [], blocked: false, isLoading, ready };
    }

    // Blank/zero batch size → the backend persists `batch_size or output_qty`, so the
    // gate evaluates at that effective value rather than silently passing (066 D6).
    const typed = Number(batchSize);
    const effectiveBatchSize = Number.isFinite(typed) && typed > 0 ? typed : (bom.output_qty ?? 0);

    const lines: FeasibilityLine[] = bom.lines
      // Stock-linked recipe lines: a raw material, or a semi-finished / finished
      // component (material_id). Section headers and free-text lines have neither.
      .filter((l) => l.raw_material_id != null || l.material_id != null)
      .map((l): FeasibilityLine => {
        // A material-linked line already carries its inventory code; a raw
        // material resolves through the RM master (code == material_code).
        const rmCode = l.material_code ?? codeById.get(l.raw_material_id as number) ?? null;
        const rmName = l.raw_material_name ?? l.ingredient_name ?? `RM #${l.raw_material_id}`;
        const unit = l.unit ?? null;

        // Free-text weight: blank or non-numeric (e.g. "Q.S.") cannot be scaled.
        const rawQty = (l.quantity ?? '').trim();
        const qtyNum = rawQty === '' ? NaN : Number(rawQty);
        const recipeQty = Number.isFinite(qtyNum) ? qtyNum : null;

        if (!rmCode || recipeQty == null || !(effectiveBatchSize > 0)) {
          return {
            lineId: l.id,
            rmCode,
            rmName,
            unit,
            recipeQty,
            required: null,
            // On-hand availability depends only on the material, not on scaling —
            // show it as soon as the template is picked (#235), so the user can
            // size the batch from what's actually in stock. No shortfall judgement
            // is made here (required is unknown without a batch size).
            available: rmCode && !isLoading ? availableByCode.get(rmCode) ?? 0 : null,
            sufficient: false,
            status: 'unmapped',
            picks: [],
          };
        }

        // Section B (FIXED_MATERIAL) consumes its FIXED quantity regardless of
        // batch size; Section A (RAW_MATERIAL & legacy) scales qty × batch.
        let required = round3(
          l.section === 'FIXED_MATERIAL' ? recipeQty : recipeQty * effectiveBatchSize,
        );

        // Unit reconciliation (mirrors backend `_reconcile_unit`): compare in the
        // STOCK UOM, not the line's — a 500 GM line vs KG stock is 0.5, not 500.
        const stockUom = uomByCode.get(rmCode) ?? null;
        const lineKey = (unit ?? '').trim().toUpperCase();
        const stockKey = (stockUom ?? '').trim().toUpperCase();
        if (lineKey && stockKey && lineKey !== stockKey) {
          const lf = uomFactor(lineKey);
          const sf = uomFactor(stockKey);
          if (lf && sf && lf.family === sf.family) {
            required = round3((required * lf.factor) / sf.factor);
          } else {
            // Unconvertible conflict — the backend will 422; surface it instead
            // of comparing apples to oranges.
            return {
              lineId: l.id,
              rmCode,
              rmName,
              unit,
              recipeQty,
              required,
              available: isLoading ? null : (availableByCode.get(rmCode) ?? 0),
              sufficient: false,
              status: 'unit_mismatch',
              stockUom,
              picks: [],
            };
          }
        }
        const available = isLoading ? null : (availableByCode.get(rmCode) ?? 0);
        const sufficient = available != null && available >= required;

        // Advisory FEFO pick: greedily draw `required` from the earliest-expiry batches.
        const picks: FeasibilityLine['picks'] = [];
        if (!isLoading) {
          let remaining = required;
          for (const row of rowsByCode.get(rmCode) ?? []) {
            if (remaining <= 0) break;
            const take = Math.min(remaining, row.available);
            picks.push({ batchNo: row.batchNo, storeCode: row.storeCode, qty: round3(take) });
            remaining -= take;
          }
        }

        return {
          lineId: l.id,
          rmCode,
          rmName,
          unit,
          recipeQty,
          required,
          available,
          sufficient,
          status: available != null && !sufficient ? 'short' : 'ok',
          stockUom,
          picks,
        };
      });

    const shortfalls = lines.filter((l) => l.status === 'short' || l.status === 'unit_mismatch');
    const blocked = !isLoading && shortfalls.length > 0;

    return { lines, shortfalls, blocked, isLoading, ready };
  }, [ready, bom, batchSize, codeById, availableByCode, rowsByCode, uomByCode, rmQuery.isPending, stockQuery.isPending]);
}
