import { cn } from '../../lib/cn';

export interface TableHeader {
  id: string;
  label: string;
  width: string;
}

export interface TableSkeletonProps {
  headers: TableHeader[];
  rowCount?: number;
  hasCheckbox?: boolean;
  hasAvatar?: boolean;
  hasActions?: boolean;
  className?: string;
}

const Pulse = ({ className }: { className?: string }) => (
  <span className={cn('inline-block animate-pulse rounded bg-secondary', className)} />
);

const TableSkeleton = ({
  headers,
  rowCount = 5,
  hasCheckbox = true,
  hasAvatar = true,
  hasActions = true,
  className,
}: TableSkeletonProps) => {
  const renderCell = (header: TableHeader, index: number) => {
    if (header.id === 'select' || (hasCheckbox && index === 0)) {
      return <Pulse className="size-4 rounded" />;
    }
    if (hasAvatar && (header.id === 'clientName' || index === 2)) {
      return (
        <div className="flex items-center gap-3">
          <Pulse className="size-8 rounded-full" />
          <div className="flex flex-1 flex-col gap-1">
            <Pulse className="h-3 w-4/5" />
            <Pulse className="h-2.5 w-3/5" />
          </div>
        </div>
      );
    }
    if (header.id === 'actions' || (hasActions && index === headers.length - 1)) {
      return (
        <div className="flex items-center gap-3">
          <Pulse className="h-8 w-16 rounded-md" />
          <Pulse className="h-8 w-20 rounded-md" />
        </div>
      );
    }
    return <Pulse className="h-3 w-3/4" />;
  };

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-left text-sm" aria-label="loading table">
        <thead className="bg-secondary/50">
          <tr>
            {headers.map((header) => (
              <th
                key={header.id}
                style={{ width: header.width }}
                className="border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {header.id === 'select' ? <Pulse className="size-4 rounded" /> : <Pulse className="h-3 w-3/5" />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <tr key={`skeleton-row-${rowIndex}`} className="border-b border-border/60 last:border-b-0">
              {headers.map((header, cellIndex) => (
                <td key={`skeleton-cell-${rowIndex}-${cellIndex}`} className="px-4 py-3">
                  {renderCell(header, cellIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableSkeleton;
export { TableSkeleton };
