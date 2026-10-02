/**
 * Read-only Price List view drawer (feature 070): product hero + version chip
 * + the pack/price rows. Opened from the table's View action / row click.
 */
import { Package } from 'lucide-react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { formatCurrency, formatDate } from '../../../utils/format';
import type { PriceListRow } from '../api/price-list';

export interface PriceListViewDrawerProps {
  open: boolean;
  row: PriceListRow | null;
  onClose: () => void;
  onEdit: (row: PriceListRow) => void;
}

export function PriceListViewDrawer({ open, row, onClose, onEdit }: PriceListViewDrawerProps) {
  return (
    <CustomDrawer
      anchor="right"
      title="Price list"
      open={open}
      onClose={onClose}
      drawerWidth="42rem"
      drawerPadding="0px"
    >
      {row && (
        <div className="flex min-h-full flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
            {/* Product hero */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Package className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">{row.product_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="font-mono">{row.product_code}</span>
                    {row.product_category ? ` · ${row.product_category}` : ''}
                    {row.item_kind === 'raw_material' ? ' · Raw material' : ''}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                v{row.version ?? 1}
              </span>
            </div>

            {/* Pack prices */}
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pack prices</p>
                <span className="text-[11px] text-muted-foreground">
                  {row.entries.length} {row.entries.length === 1 ? 'pack' : 'packs'}
                </span>
              </div>
              <div className="overflow-hidden rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Pack</th>
                      <th className="w-32 px-3 py-2 text-right font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.entries.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-3 py-4 text-center text-muted-foreground">
                          No pack prices.
                        </td>
                      </tr>
                    ) : (
                      row.entries.map((e) => (
                        <tr key={e.id} className="border-t border-border/60">
                          <td className="px-3 py-2 font-medium text-foreground">{e.pack_label}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums text-foreground">
                            {formatCurrency(Number(e.price))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Record facts */}
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details</p>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Version</dt>
                  <dd className="font-medium text-foreground">Version {row.version ?? 1}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Last updated</dt>
                  <dd className="font-medium text-foreground">{formatDate(row.updated_at)}</dd>
                </div>
              </dl>
            </div>
          </div>
          <div className="shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
            <CustomButton type="button" variant="outline" onClick={onClose}>
              Close
            </CustomButton>
            <CustomButton type="button" variant="primary" onClick={() => onEdit(row)}>
              Edit
            </CustomButton>
          </div>
        </div>
      )}
    </CustomDrawer>
  );
}
