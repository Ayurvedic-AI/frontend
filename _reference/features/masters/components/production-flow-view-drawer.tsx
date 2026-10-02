/**
 * Read-only Production Flow view drawer: name/code hero + the ordered
 * production steps. Opened from the table's View action / row click.
 * Mirrors the raw-material / SFG / product view drawer UI.
 */
import type { ReactNode } from 'react';
import { Workflow } from 'lucide-react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import type { ProductionFlowItem } from '../../../sdk/schemas';

export interface ProductionFlowViewDrawerProps {
  open: boolean;
  flow: ProductionFlowItem | null;
  onClose: () => void;
  onEdit: (flow: ProductionFlowItem) => void;
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

export function ProductionFlowViewDrawer({ open, flow, onClose, onEdit }: ProductionFlowViewDrawerProps) {
  return (
    <CustomDrawer
      anchor="right"
      title="Production flow"
      open={open}
      onClose={onClose}
      drawerWidth="42rem"
      drawerPadding="0px"
    >
      {flow && (
        <div className="flex min-h-full flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
            {/* Identity hero */}
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Workflow className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-foreground">{flow.name}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{flow.code}</p>
                </div>
              </div>
            </div>

            {/* Mirrors the add/edit form: flow name + ordered production steps. */}
            <SectionCard title="Production steps">
              {flow.steps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No steps</p>
              ) : (
                <ol className="flex flex-col gap-2">
                  {flow.steps.map((s, i) => (
                    <li key={`${flow.id}-${i}`} className="flex items-center gap-2.5 text-sm">
                      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                        {i + 1}
                      </span>
                      <span className="font-medium uppercase text-foreground">{s.label}</span>
                    </li>
                  ))}
                </ol>
              )}
            </SectionCard>
          </div>
          <div className="shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
            <CustomButton type="button" variant="outline" onClick={onClose}>
              Close
            </CustomButton>
            <CustomButton type="button" variant="primary" onClick={() => onEdit(flow)}>
              Edit
            </CustomButton>
          </div>
        </div>
      )}
    </CustomDrawer>
  );
}
