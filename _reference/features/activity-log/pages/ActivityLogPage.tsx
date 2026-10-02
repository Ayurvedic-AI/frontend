import { useState } from 'react';
import type { SortingState } from '@tanstack/react-table';
import { CustomSearch } from '../../../common/custom-search';
import { useActivityLog } from '../hooks/useActivityLog';
import { ActivityLogTable } from '../components/ActivityLogTable';
import { AuditDetailDialog } from '../components/AuditDetailDialog';
import type { AuditRow } from '../api/activity-log';

export function ActivityLogPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AuditRow | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);

  const sort = sorting[0]?.id;
  const order: 'asc' | 'desc' | undefined = sorting[0]
    ? sorting[0].desc
      ? 'desc'
      : 'asc'
    : undefined;

  const { entries, total, isLoading } = useActivityLog({
    page,
    pageSize,
    q: search,
    sort,
    order,
  });

  // New search should always start from the first page.
  const handleSearch = (term: string) => {
    setSearch(term);
    setPage(0);
  };

  // Re-sorting should also reset to the first page.
  const handleSort = (next: SortingState) => {
    setSorting(next);
    setPage(0);
  };

  return (
    <div className="w-full px-4 py-6 sm:px-6">
      {/* Header: title left, search right */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Activity log</h1>
          {/* <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Who did what and when, across every module.
          </p> */}
        </div>
        <CustomSearch
          textData={{ placeholder: 'Search by user, action or entity', btnTitle: 'Search' }}
          onSearch={handleSearch}
          hasStartSearchIcon
          width="20rem"
        />
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <ActivityLogTable
          entries={entries}
          loading={isLoading}
          onRowClick={setSelected}
          page={page}
          pageSize={pageSize}
          total={total}
          onPaginationChange={({ pageIndex, pageSize: nextSize }) => {
            setPage(pageIndex);
            setPageSize(nextSize);
          }}
          sorting={sorting}
          onSortingChange={handleSort}
        />
      </div>

      <AuditDetailDialog entry={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default ActivityLogPage;
