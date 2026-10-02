/* eslint-disable react-refresh/only-export-components */
import { useMemo } from 'react';
import { cn } from '../../../lib/cn';
import type { BomOrderAllocationOut } from '../../../sdk/schemas';

/** Colour map for an allocation's lifecycle status (feature 067). */
const ALLOC_STATUS_STYLES: Record<string, string> = {
  HELD: 'bg-amber-100 text-amber-800',
  CONSUMED: 'bg-green-100 text-green-800',
  RELEASED: 'bg-secondary text-secondary-foreground',
};

/** Format a numeric quantity string to exactly 2 decimals (e.g. "24.00"); pass non-numeric through. */
export function fmtQty(q: string | null | undefined): string {
  if (q == null || String(q).trim() === '') return '—';
  const n = Number(q);
  return Number.isFinite(n) ? n.toFixed(2) : String(q);
}

interface GroupedAllocation {
  code: string;
  name: string;
  rows: BomOrderAllocationOut[];
  total: number;
}

/** Group allocations by material_code, summing the reserved quantity. */
function useAllocationGroups(allocations: BomOrderAllocationOut[]): GroupedAllocation[] {
  return useMemo(() => {
    const map = new Map<string, GroupedAllocation>();
    for (const a of allocations) {
      const g =
        map.get(a.material_code) ?? { code: a.material_code, name: a.material_name, rows: [], total: 0 };
      g.rows.push(a);
      const n = Number(a.quantity);
      if (Number.isFinite(n)) g.total += n;
      map.set(a.material_code, g);
    }
    return [...map.values()];
  }, [allocations]);
}

interface Props {
  allocations: BomOrderAllocationOut[];
  /** Message shown when there are no allocations. */
  emptyMessage?: string;
  /** material_code → category name; when provided, a category chip renders next to the material name. */
  categoryByCode?: Map<string, string>;
}

/**
 * Read-only reserved-RM (067 allocations) display: grouped by material with
 * batch / store / qty / lifecycle-status. Shared by the BOM-order detail drawer
 * and the Manufacturing detail drawer. Render your own section title above it.
 */
export function BomOrderAllocationsPanel({
  allocations,
  emptyMessage = 'No raw material has been reserved for this order yet.',
  categoryByCode,
}: Props) {
  const groups = useAllocationGroups(allocations);

  if (groups.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((g) => (
        <div key={g.code} className="overflow-hidden rounded-lg border border-border">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 px-3 py-2">
            <span className="font-medium text-foreground">
              {g.name}
              <span className="ml-2 font-mono text-xs text-muted-foreground">{g.code}</span>
              {categoryByCode?.get(g.code) && (
                <span className="ml-2 inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                  {categoryByCode.get(g.code)}
                </span>
              )}
              {g.rows.some((r) => r.is_extra) && (
                <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">EXTRA</span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              reserved <span className="tabular-nums">{fmtQty(String(g.total))}</span>
            </span>
          </div>
          {g.rows.find((r) => r.note)?.note && (
            <p className="px-3 pt-2 text-xs italic text-muted-foreground">note: {g.rows.find((r) => r.note)?.note}</p>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-1.5 font-medium">Batch</th>
                <th className="px-3 py-1.5 font-medium">Store</th>
                <th className="px-3 py-1.5 text-right font-medium">Qty</th>
                <th className="px-3 py-1.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {g.rows.map((a, i) => (
                <tr key={`${g.code}-${i}`} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-xs text-foreground">{a.batch_no}</td>
                  <td className="px-3 py-2 text-foreground">{a.store_name}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">{fmtQty(a.quantity)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                        ALLOC_STATUS_STYLES[a.status] ?? 'bg-secondary text-secondary-foreground',
                      )}
                    >
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
