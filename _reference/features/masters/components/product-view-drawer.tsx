/**
 * Read-only Finished Good Product view drawer: name/SKU hero + the add/edit
 * form's fields. Opened from the table's View action / row click.
 * Mirrors the raw-material / SFG view drawer UI.
 */
import type { ReactNode } from 'react';
import { Box } from 'lucide-react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import type { ProductRow } from '../api/products';
import { ActivePill } from './ActivePill';

export interface ProductViewDrawerProps {
  open: boolean;
  product: ProductRow | null;
  onClose: () => void;
  onEdit: (product: ProductRow) => void;
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`font-medium text-foreground ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</dd>
    </div>
  );
}

export function ProductViewDrawer({ open, product, onClose, onEdit }: ProductViewDrawerProps) {
  return (
    <CustomDrawer
      anchor="right"
      title="Product"
      open={open}
      onClose={onClose}
      drawerWidth="42rem"
      drawerPadding="0px"
    >
      {product && (
        <div className="flex min-h-full flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
            {/* Identity hero */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Box className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">{product.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="font-mono">{product.code}</span>
                    {product.category ? ` · ${product.category}` : ''}
                  </p>
                </div>
              </div>
              <ActivePill active={product.is_active} />
            </div>

            {/* Mirrors the add/edit form fields exactly. */}
            <SectionCard title="Details">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Field label="SKU" value={product.code} mono />
                <Field label="Name" value={product.name} />
                <Field label="Category" value={product.category ?? '—'} />
                <Field label="HSN" value={product.hsn ?? '—'} />
                <Field label="Unit" value={product.pack_size ?? '—'} />
                <Field
                  label="Shelf life"
                  value={product.shelf_life_months != null ? `${product.shelf_life_months} months` : '—'}
                />
                <Field label="Re-order level" value={product.reorder_level ?? '—'} />
              </dl>
            </SectionCard>
          </div>
          <div className="shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
            <CustomButton type="button" variant="outline" onClick={onClose}>
              Close
            </CustomButton>
            <CustomButton type="button" variant="primary" onClick={() => onEdit(product)}>
              Edit
            </CustomButton>
          </div>
        </div>
      )}
    </CustomDrawer>
  );
}
