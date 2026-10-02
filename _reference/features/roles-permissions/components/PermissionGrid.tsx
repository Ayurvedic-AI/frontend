import { Check, X } from 'lucide-react';
import { CustomCheckbox } from '../../../common/custom-checkbox';
import { cn } from '../../../lib/cn';
import type { ActionCell, FeatureRow } from '../api/roles';

/** Column order matches the backend's `cells` order (view/create/update/delete). */
const ACTION_COLUMNS: { key: string; label: string }[] = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'update', label: 'Update' },
  { key: 'delete', label: 'Delete' },
];

interface PermissionGridProps {
  matrix: FeatureRow[];
  /** Edit mode renders checkboxes; view mode renders ✓/✗ indicators. */
  editing?: boolean;
  /** Edit mode: the currently-selected permission names (controlled by parent). */
  selected?: Set<string>;
  /** Edit mode: toggle a single permission. */
  onToggle?: (permission: string, checked: boolean) => void;
  /** Edit mode: toggle every applicable permission in a feature row. */
  onToggleRow?: (permissions: string[], checked: boolean) => void;
}

/** Read-only ✓ / ✗ indicator for a single granted state. */
function GrantIndicator({ granted }: { granted: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex size-5 items-center justify-center rounded-md border',
        granted
          ? 'border-positive/30 bg-positive/10 text-positive'
          : 'border-input bg-muted/40 text-muted-foreground/50',
      )}
      aria-label={granted ? 'Granted' : 'Not granted'}
    >
      {granted ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
    </span>
  );
}

/**
 * Feature × action permission grid (rows = features, columns = All / View /
 * Create / Update / Delete). In view mode each applicable cell shows a granted
 * (✓) / not-granted (✗) indicator; non-applicable cells render "—". In edit mode
 * applicable cells are `CustomCheckbox`es and the "All" column toggles the whole
 * row. The grid scrolls horizontally with a sticky feature column on narrow
 * viewports (Constitution Principle V).
 */
export function PermissionGrid({
  matrix,
  editing = false,
  selected,
  onToggle,
  onToggleRow,
}: PermissionGridProps) {
  const isGranted = (cell: ActionCell): boolean =>
    editing ? Boolean(selected?.has(cell.permission)) : cell.granted;

  const cellFor = (row: FeatureRow, action: string): ActionCell | undefined =>
    row.cells.find((c) => c.action === action);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="sticky left-0 z-10 bg-muted/40 px-4 py-3 text-left font-medium text-muted-foreground">
              Features
            </th>
            <th className="px-3 py-3 text-center font-medium text-muted-foreground">All</th>
            {ACTION_COLUMNS.map((col) => (
              <th key={col.key} className="px-3 py-3 text-center font-medium text-muted-foreground">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row) => {
            const applicable = row.cells.filter((c) => c.applicable);
            const grantedCount = applicable.filter(isGranted).length;
            const allGranted = applicable.length > 0 && grantedCount === applicable.length;
            const someGranted = grantedCount > 0 && !allGranted;
            const applicableNames = applicable.map((c) => c.permission);

            return (
              <tr key={row.feature} className="border-b border-border/70 last:border-0">
                <td className="sticky left-0 z-10 bg-card px-4 py-3 font-medium text-foreground">
                  {row.label}
                </td>

                {/* All column */}
                <td className="px-3 py-3 text-center">
                  {editing ? (
                    <div className="flex justify-center">
                      <CustomCheckbox
                        label={`All ${row.label}`}
                        showText={false}
                        checked={allGranted}
                        indeterminate={someGranted}
                        disabled={applicable.length === 0}
                        onChange={(checked) => onToggleRow?.(applicableNames, checked)}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <GrantIndicator granted={allGranted} />
                    </div>
                  )}
                </td>

                {/* Action columns */}
                {ACTION_COLUMNS.map((col) => {
                  const cell = cellFor(row, col.key);
                  if (!cell || !cell.applicable) {
                    return (
                      <td key={col.key} className="px-3 py-3 text-center text-muted-foreground/40">
                        —
                      </td>
                    );
                  }
                  return (
                    <td key={col.key} className="px-3 py-3 text-center">
                      <div className="flex justify-center">
                        {editing ? (
                          <CustomCheckbox
                            label={`${col.label} ${row.label}`}
                            showText={false}
                            checked={isGranted(cell)}
                            onChange={(checked) => onToggle?.(cell.permission, checked)}
                          />
                        ) : (
                          <GrantIndicator granted={isGranted(cell)} />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
