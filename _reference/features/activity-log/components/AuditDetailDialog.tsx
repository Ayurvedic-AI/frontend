import { CustomDrawer } from '../../../common/custom-drawer';
import { CustomButton } from '../../../common/custom-buttons';
import { cn } from '../../../lib/cn';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { formatDateTime, formatRelativeTime, prettyJson } from '../../../utils/format';
import { describeActivity, activityToneClass } from '../../../utils/activity';
import { useAdminGetActivityLogEntry } from '../../../sdk/activity-log';
import type { ActivityLogDetail } from '../../../sdk/schemas';
import type { AuditRow } from '../api/activity-log';
import { ActivityAction } from './ActivityAction';

interface AuditDetailDialogProps {
  entry: AuditRow | null;
  onClose: () => void;
}

/** Render the entity as a friendly label, matching the list's "Record" column:
 *  prefer the API-resolved name, else a prettified entity type with `#id`. */
function renderEntity(row?: { entity_type?: string | null; record_id?: number | string | null; record_name?: string | null } | null) {
  if (!row) return '—';
  const { entity_type, record_id, record_name } = row;
  if (record_name) return record_name;
  if (!entity_type && record_id == null) return '—';
  const name = entity_type
    ? entity_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Record';
  return (
    <>
      {name}
      {record_id != null && <span className="text-muted-foreground"> #{record_id}</span>}
    </>
  );
}

// ── Field-by-field diff of the before/after snapshots ───────────────────────
// End users shouldn't have to read raw JSON: show only the fields that
// actually changed, as "old → new" rows. The raw snapshots stay available
// behind a collapsible for power users.

const HIDDEN_KEYS = new Set(['updated_at', 'created_at', 'id']);

function fieldLabel(key: string): string {
  const s = key.replace(/_/g, ' ').trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : key;
}

function displayValue(v: unknown): string {
  if (v == null || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') {
    const s = JSON.stringify(v);
    return s.length > 80 ? `${s.slice(0, 77)}…` : s;
  }
  return String(v);
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function diffStates(beforeState: unknown, afterState: unknown): { key: string; before: unknown; after: unknown }[] {
  const b = asRecord(beforeState);
  const a = asRecord(afterState);
  if (!b && !a) return [];
  const keys = Array.from(new Set([...Object.keys(b ?? {}), ...Object.keys(a ?? {})])).filter(
    (k) => !HIDDEN_KEYS.has(k),
  );
  return keys
    .map((key) => ({ key, before: b?.[key], after: a?.[key] }))
    .filter(({ before, after }) => JSON.stringify(before ?? null) !== JSON.stringify(after ?? null));
}

/** Row-click detail: actor/action metadata + a readable field-change list
 *  (before/after live on the detail endpoint, so fetch the full entry on open). */
export function AuditDetailDialog({ entry, onClose }: AuditDetailDialogProps) {
  const query = useAdminGetActivityLogEntry(entry?.id ?? 0, {
    query: { enabled: entry !== null },
  });
  const detail = (query.data as { data?: ActivityLogDetail } | undefined)?.data;
  const row = detail ?? entry;
  const before = prettyJson(detail?.before_state);
  const after = prettyJson(detail?.after_state);
  const desc = row ? describeActivity(row.action, row.entity_type) : null;

  const changes = diffStates(detail?.before_state, detail?.after_state);
  const isCreate = Boolean(detail?.after_state && !detail?.before_state);
  const isDelete = Boolean(detail?.before_state && !detail?.after_state);

  return (
    <CustomDrawer
      anchor="right"
      title="Activity detail"
      open={entry !== null}
      onClose={onClose}
      drawerWidth="42rem"
      drawerPadding="0px"
    >
      {entry && row && (
        <div className="flex min-h-full flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5 text-sm">
          {/* What happened, by whom, how long ago */}
          {desc && (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <span
                className={cn(
                  'inline-flex size-10 shrink-0 items-center justify-center rounded-full',
                  activityToneClass(desc.tone),
                )}
              >
                <desc.Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-base font-semibold text-foreground">{desc.label}</p>
                <p className="text-xs text-muted-foreground">
                  {row.actor?.name ?? row.actor?.email ?? 'System'} · {formatRelativeTime(row.created_at)}
                </p>
              </div>
            </div>
          )}

          {/* Context facts */}
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <dt className="text-xs text-muted-foreground">When</dt>
                <dd className="font-medium text-foreground">{formatDateTime(row?.created_at ?? '')}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Who</dt>
                <dd className="truncate font-medium text-foreground" title={row?.actor?.email ?? undefined}>
                  {row?.actor?.name ?? row?.actor?.email ?? 'System'}
                  {row?.actor?.role ? ` (${row?.actor?.role})` : ''}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Action</dt>
                <dd className="text-foreground">{row?.action ? <ActivityAction action={row.action} /> : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Record</dt>
                <dd className="font-medium text-foreground">{renderEntity(row)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">IP</dt>
                <dd className="font-medium text-foreground">{row?.ip ?? '—'}</dd>
              </div>
            </dl>
          </div>

          {/* What changed — field-by-field, old → new */}
          {changes.length > 0 ? (
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {isCreate ? 'New values' : isDelete ? 'Removed values' : `What changed (${changes.length} ${changes.length === 1 ? 'field' : 'fields'})`}
              </p>
              <ul className="flex flex-col divide-y divide-border/60">
                {changes.map(({ key, before: b, after: a }) => (
                  <li key={key} className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0">
                    <span className="text-xs text-muted-foreground">{fieldLabel(key)}</span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      {!isCreate && (
                        <span
                          className={cn(
                            'max-w-full truncate rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive',
                            b == null && 'opacity-60',
                          )}
                          title={displayValue(b)}
                        >
                          {displayValue(b)}
                        </span>
                      )}
                      {!isCreate && !isDelete && <ArrowRight className="size-3 shrink-0 text-muted-foreground" />}
                      {!isDelete && (
                        <span
                          className="max-w-full truncate rounded bg-positive/10 px-1.5 py-0.5 text-xs text-positive-70"
                          title={displayValue(a)}
                        >
                          {displayValue(a)}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Raw snapshots for power users, collapsed by default */}
          {(before || after) && (
            <details className="group rounded-lg border border-border">
              <summary className="flex cursor-pointer select-none items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                View raw data
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="flex flex-col gap-3 border-t border-border p-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Before</p>
                  <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs text-foreground">
                    {before ?? '—'}
                  </pre>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">After</p>
                  <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs text-foreground">
                    {after ?? '—'}
                  </pre>
                </div>
              </div>
            </details>
          )}

            {!before && !after && changes.length === 0 && (
              <p className="text-xs text-muted-foreground">No before/after snapshot recorded for this event.</p>
            )}
          </div>
          <div className="sticky bottom-0 shrink-0 flex justify-end border-t border-border bg-background px-6 py-4">
            <CustomButton type="button" variant="outline" onClick={onClose}>
              Close
            </CustomButton>
          </div>
        </div>
      )}
    </CustomDrawer>
  );
}
