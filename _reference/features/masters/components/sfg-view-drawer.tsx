/**
 * Read-only Semi-Finished Good view drawer: name/code hero + the master
 * attributes. Opened from the table's View action / row click.
 * Mirrors the raw-material / vendor view drawer UI.
 */
import type { ReactNode } from 'react';
import { Layers } from 'lucide-react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import type { SemiFinishedGoodRow } from '../api/semi-finished-goods';
import { ActivePill } from './ActivePill';

export interface SfgViewDrawerProps {
  open: boolean;
  sfg: SemiFinishedGoodRow | null;
  onClose: () => void;
  onEdit: (sfg: SemiFinishedGoodRow) => void;
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

export function SfgViewDrawer({ open, sfg, onClose, onEdit }: SfgViewDrawerProps) {
  return (
    <CustomDrawer
      anchor="right"
      title="Semi-finished good"
      open={open}
      onClose={onClose}
      drawerWidth="42rem"
      drawerPadding="0px"
    >
      {sfg && (
        <div className="flex min-h-full flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
            {/* Identity hero */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Layers className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">{sfg.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="font-mono">{sfg.code}</span>
                    {sfg.sfg_category_name ? ` · ${sfg.sfg_category_name}` : ''}
                  </p>
                </div>
              </div>
              <ActivePill active={sfg.is_active} />
            </div>

            {/* Mirrors the add/edit form fields exactly. */}
            <SectionCard title="Details">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <Field label="Name" value={sfg.name} />
                <Field label="Code" value={sfg.code} mono />
                <Field label="Category" value={sfg.sfg_category_name ?? '—'} />
                <Field label="Unit of measure" value={sfg.unit ?? '—'} />
                <Field label="Re-order level" value={sfg.reorder_level ?? '—'} />
                <Field
                  label="Shelf life"
                  value={sfg.shelf_life_months != null ? `${sfg.shelf_life_months} months` : '—'}
                />
              </dl>
            </SectionCard>
          </div>
          <div className="shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
            <CustomButton type="button" variant="outline" onClick={onClose}>
              Close
            </CustomButton>
            <CustomButton type="button" variant="primary" onClick={() => onEdit(sfg)}>
              Edit
            </CustomButton>
          </div>
        </div>
      )}
    </CustomDrawer>
  );
}
