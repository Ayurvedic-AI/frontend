import { useMemo } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { CommonTable, type ColumnDef } from '../../../common/common-table';
import { ActionMenu, type ActionMenuItem } from '../../../common/action-menu';
import type { ProductionFlowItem } from '../../../sdk/schemas';

interface Props {
  flows: ProductionFlowItem[];
  loading: boolean;
  onView: (flow: ProductionFlowItem) => void;
  onEdit: (flow: ProductionFlowItem) => void;
  onDelete: (flow: ProductionFlowItem) => void;
}

/** Production Flows master list: flow name (with code) + its step chain. */
export function ProductionFlowsTable({ flows, loading, onView, onEdit, onDelete }: Props) {
  const columns = useMemo<ColumnDef<ProductionFlowItem, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Flow',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.name}
            <span className="ml-2 font-mono text-xs text-muted-foreground">{row.original.code}</span>
          </span>
        ),
      },
      {
        id: 'steps',
        header: 'Production steps',
        cell: ({ row }) =>
          row.original.steps.length === 0 ? (
            <span className="text-sm text-muted-foreground">No steps</span>
          ) : (
            <span className="flex flex-wrap items-center gap-1">
              {row.original.steps.map((s, i) => (
                <span
                  key={`${row.original.id}-${i}`}
                  className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium uppercase text-secondary-foreground"
                >
                  {i + 1}. {s.label}
                </span>
              ))}
            </span>
          ),
      },
      {
        id: 'actions',
        header: 'Actions',
        meta: { align: 'center' },
        cell: ({ row }) => {
          const items: ActionMenuItem[] = [
            { label: 'View', icon: <Eye className="size-4" />, onClick: () => onView(row.original) },
            { label: 'Edit', icon: <Pencil className="size-4" />, onClick: () => onEdit(row.original) },
          ];
          if (row.original.code !== 'GENERIC') {
            items.push({
              label: 'Delete',
              icon: <Trash2 className="size-4" />,
              onClick: () => onDelete(row.original),
              color: 'text-destructive',
            });
          }
          return <ActionMenu ariaLabel={`Actions for ${row.original.name}`} items={items} />;
        },
      },
    ],
    [onView, onEdit, onDelete],
  );

  return (
    <CommonTable<ProductionFlowItem>
      columns={columns}
      data={flows}
      loading={loading}
      enablePagination
      pageSize={10}
      getRowId={(row) => String(row.id)}
      onRowClick={onView}
      emptyState={<div className="py-12 text-center text-sm text-muted-foreground">No production flows yet.</div>}
    />
  );
}

export default ProductionFlowsTable;
