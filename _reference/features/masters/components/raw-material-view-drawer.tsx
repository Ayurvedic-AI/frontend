/**
 * Read-only Raw Material view drawer: identity hero + details / stock-settings
 * cards. Opened from the table's View action / row click.
 */
import type { ReactNode } from 'react';
import { Package } from 'lucide-react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import type { RawMaterialRow } from '../api/raw-materials';
import { ActivePill } from './ActivePill';

export interface RawMaterialViewDrawerProps {
  open: boolean;
  material: RawMaterialRow | null;
  onClose: () => void;
  onEdit: (material: RawMaterialRow) => void;
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

export function RawMaterialViewDrawer({ open, material, onClose, onEdit }: RawMaterialViewDrawerProps) {
  return (
    <CustomDrawer
      anchor="right"
      title="Raw material"
      open={open}
      onClose={onClose}
      drawerWidth="42rem"
      drawerPadding="0px"
    >
      {material && (
        <div className="flex min-h-full flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
            {/* Identity hero */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Package className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">{material.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {material.code}
                    {material.category_type_name ? ` · ${material.category_type_name}` : ''}
                  </p>
                </div>
              </div>
              <ActivePill active={material.is_active} />
            </div>

            {/* Mirrors the add/edit form fields exactly: name/code in the hero,
                then Category · Unit of measure · Re-order level. */}
            <SectionCard title="Details">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Field label="Name" value={material.name} />
                <Field label="Code" value={material.code} mono />
                <Field label="Category" value={material.category_type_name ?? '—'} />
                <Field label="Unit of measure" value={material.unit || '—'} />
                <Field label="Re-order level" value={material.reorder_level ?? '—'} />
              </dl>
            </SectionCard>
          </div>
          <div className="shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
            <CustomButton type="button" variant="outline" onClick={onClose}>
              Close
            </CustomButton>
            <CustomButton type="button" variant="primary" onClick={() => onEdit(material)}>
              Edit
            </CustomButton>
          </div>
        </div>
      )}
    </CustomDrawer>
  );
}
