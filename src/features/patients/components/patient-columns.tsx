import dayjs from 'dayjs';
import { Pencil, Sparkles, Trash2 } from 'lucide-react';
import { ActionMenu } from '../../../common/action-menu';
import type { ColumnDef } from '../../../common/common-table';
import { formatDate } from '../../../utils/format';
import { formatIndianPhone } from '../../../utils/phone';
import { GENDER_LABEL, PRAKRITI_LABEL, type Patient } from '../api/patients-stubs';
import { ageInYears } from '../utils/filter-patients';
import { AllergyPills } from './AllergyPills';

const muted = 'text-muted-foreground';

function lastVisitLabel(date: string | null): string {
  if (!date) return 'No visits yet';
  const days = dayjs().startOf('day').diff(dayjs(date), 'day');
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return formatDate(date);
}

export function patientColumns(actions: {
  onEdit: (p: Patient) => void;
  onViewSummary: (p: Patient) => void;
  onDelete: (p: Patient) => void;
}): ColumnDef<Patient, unknown>[] {
  return [
    {
      id: 'full_name',
      accessorKey: 'full_name',
      header: 'Patient',
      size: 250,
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-medium text-foreground">
              <span className="truncate">{p.full_name}</span>
              {p.status === 'inactive' && (
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-neutral-50">
                  Inactive
                </span>
              )}
            </p>
            <p className={`text-xs tabular-nums ${muted}`}>
              {p.id} · {formatIndianPhone(p.phone)}
            </p>
            {/* Below md the Allergies column is hidden, so the safety facts ride under the name. */}
            {p.allergies.length > 0 && (
              <div className="mt-1.5 md:hidden">
                <AllergyPills allergies={p.allergies} />
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'allergies',
      header: 'Allergies',
      size: 220,
      enableSorting: false,
      // Below md the pills ride under the patient's name instead (see the name cell).
      meta: { className: 'hidden md:table-cell' },
      cell: ({ row }) => <AllergyPills allergies={row.original.allergies} />,
    },
    {
      id: 'age',
      header: 'Age / Sex',
      size: 96,
      accessorFn: (p) => ageInYears(p.date_of_birth),
      cell: ({ row }) => (
        <span className="tabular-nums">
          {ageInYears(row.original.date_of_birth)}
          <span className={muted}> · {GENDER_LABEL[row.original.gender].charAt(0)}</span>
        </span>
      ),
    },
    {
      id: 'prakriti',
      accessorKey: 'prakriti',
      header: 'Prakriti',
      size: 120,
      cell: ({ row }) => {
        const v = row.original.prakriti;
        return <span className={v === 'unknown' ? muted : undefined}>{PRAKRITI_LABEL[v]}</span>;
      },
    },
    {
      id: 'last_visit',
      header: 'Last visit',
      size: 120,
      accessorFn: (p) => p.last_visit ?? '',
      cell: ({ row }) => {
        const v = row.original.last_visit;
        return <span className={`tabular-nums ${v ? '' : muted}`}>{lastVisitLabel(v)}</span>;
      },
    },
    {
      id: 'actions',
      header: '',
      size: 56,
      enableSorting: false,
      meta: { align: 'right' },
      cell: ({ row }) => (
        <ActionMenu
          ariaLabel={`Actions for ${row.original.full_name}`}
          items={[
            { label: 'Edit', icon: <Pencil className="size-4" />, onClick: () => actions.onEdit(row.original) },
            {
              label: 'View AI summary',
              icon: <Sparkles className="size-4" />,
              onClick: () => actions.onViewSummary(row.original),
            },
            {
              label: 'Delete',
              icon: <Trash2 className="size-4" />,
              color: 'var(--color-destructive)',
              onClick: () => actions.onDelete(row.original),
            },
          ]}
        />
      ),
    },
  ];
}
