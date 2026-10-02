import { useMemo } from 'react';
import { FlaskConical } from 'lucide-react';
import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import type { BomRow } from '../api/boms';
import { useProducts } from '../hooks/useProducts';
import { useProductionFlows } from '../hooks/use-production-flows';

interface BomDetailDrawerProps {
  bom: BomRow | null;
  onClose: () => void;
  /** Opens the edit drawer for this template (footer Edit button). */
  onEdit?: (bom: BomRow) => void;
}

type BomLine = BomRow['lines'][number];

// Display order + labels for the recipe sections (feature 070). Legacy
// dispensing-sheet sections keep their own headings; SECTION_HEADER rows are
// import artifacts and are folded away (each line already knows its section).
const SECTION_GROUPS: { key: string; sections: string[]; title: string; hint?: string }[] = [
  {
    key: 'a',
    sections: ['RAW_MATERIAL'],
    title: 'Section A — Scales with batch size',
    hint: 'Stock materials · quantity × batch size',
  },
  {
    key: 'b',
    sections: ['FIXED_MATERIAL'],
    title: 'Section B — Fixed quantity',
    hint: 'Stock materials · same quantity on any batch size',
  },
  {
    key: 'ing-scaled',
    sections: ['INGREDIENT_SCALED'],
    title: 'Other ingredients — scales with batch size',
    hint: 'Not tracked in stock',
  },
  {
    key: 'ing-fixed',
    sections: ['INGREDIENT_FIXED'],
    title: 'Other ingredients — fixed quantity',
    hint: 'Not tracked in stock',
  },
  { key: 'bhavana', sections: ['BHAVANA'], title: 'Bhavana' },
  { key: 'excipient', sections: ['EXCIPIENT'], title: 'Excipients' },
];

function LinesTable({ lines }: { lines: BomLine[] }) {
  // Rendered inside a bordered section card, so the table itself is frameless.
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2 font-medium">Material</th>
            <th className="px-3 py-2 font-medium">Quantity</th>
            <th className="px-3 py-2 font-medium">Unit</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="border-t border-border">
              <td className="px-3 py-2 text-foreground">
                {line.ingredient_name ?? line.raw_material_name ?? '—'}
              </td>
              <td className="px-3 py-2 tabular-nums text-foreground">{line.quantity ?? '—'}</td>
              <td className="px-3 py-2 text-muted-foreground">{line.unit ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Name-link detail: BOM header + its line items grouped by section. */
export function BomDetailDrawer({ bom, onClose, onEdit }: BomDetailDrawerProps) {
  const { products } = useProducts();
  const category = bom ? products.find((p) => p.id === bom.product_id)?.category : undefined;
  // Production flow name from the flows master (falls back to the raw code).
  const { flows } = useProductionFlows();
  const flowName = bom?.flow_type
    ? flows.find((f) => f.code === bom.flow_type)?.name ?? bom.flow_type
    : undefined;

  const groups = useMemo(() => {
    const lines = (bom?.lines ?? []).filter((l) => l.section !== 'SECTION_HEADER');
    const known = new Set(SECTION_GROUPS.flatMap((g) => g.sections));
    const out = SECTION_GROUPS.map((g) => ({
      ...g,
      lines: lines.filter((l) => g.sections.includes(l.section ?? 'RAW_MATERIAL')),
    })).filter((g) => g.lines.length > 0);
    // Anything with an unrecognised section still shows (future-proofing).
    const rest = lines.filter((l) => !known.has(l.section ?? 'RAW_MATERIAL'));
    if (rest.length) out.push({ key: 'other', sections: [], title: 'Other lines', lines: rest });
    return out;
  }, [bom]);

  const totalLines = groups.reduce((sum, g) => sum + g.lines.length, 0);

  return (
    <CustomDrawer
      anchor="right"
      title="BOM Template"
      open={bom !== null}
      onClose={onClose}
      drawerWidth="48rem"
      drawerPadding="0px"
    >
      {bom && (
        <div className="flex min-h-full flex-col">
          <div className="flex flex-1 flex-col gap-3 px-6 py-5 text-sm">
          {/* Recipe hero — what this template produces. */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FlaskConical className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-foreground">{bom.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                Produces {bom.product_name ?? '—'}
                {category ? ` · ${category}` : ''}
                {flowName ? ` · Flow: ${flowName}` : ''}
                {bom.output_qty != null ? ` · Default batch size: ${bom.output_qty}` : ''} · {totalLines}{' '}
                {totalLines === 1 ? 'line' : 'lines'}
              </p>
            </div>
          </div>

          {groups.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No ingredient lines.</p>
          ) : (
            groups.map((group) => (
              <div key={group.key} className="overflow-hidden rounded-lg border border-border">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border bg-secondary/40 px-3 py-2">
                  <p className="text-sm font-semibold text-foreground">{group.title}</p>
                  <span className="text-[11px] text-muted-foreground">
                    {group.hint ? `${group.hint} · ` : ''}
                    {group.lines.length} {group.lines.length === 1 ? 'line' : 'lines'}
                  </span>
                </div>
                <LinesTable lines={group.lines} />
              </div>
            ))
          )}
          </div>

          {/* Sticky footer — Close, Edit jumps into the edit drawer. */}
          <div className="sticky bottom-0 shrink-0 flex justify-end gap-3 border-t border-border bg-background px-6 py-4">
            <CustomButton type="button" variant="outline" onClick={onClose}>
              Close
            </CustomButton>
            {onEdit && (
              <CustomButton type="button" variant="primary" onClick={() => onEdit(bom)}>
                Edit
              </CustomButton>
            )}
          </div>
        </div>
      )}
    </CustomDrawer>
  );
}
