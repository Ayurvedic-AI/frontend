import { useMemo, useState } from 'react';
import {
  ActionMenu,
  CommonTable,
  Paginator,
  UserAvatar,
  type ColumnDef,
} from '../../common';

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'active' | 'invited' | 'inactive';
  joinedAt: string;
  src?: string;
}

const PEOPLE: Person[] = [
  { id: '1', firstName: 'Alice', lastName: 'Liddell', role: 'Engineer', status: 'active', joinedAt: '2024-01-12' },
  { id: '2', firstName: 'Bob', lastName: 'Stone', role: 'Designer', status: 'active', joinedAt: '2024-04-02' },
  { id: '3', firstName: 'Carol', lastName: 'Reyes', role: 'Product', status: 'invited', joinedAt: '2025-09-20' },
  { id: '4', firstName: 'Dan', lastName: 'Patel', role: 'Engineer', status: 'inactive', joinedAt: '2023-07-15' },
  { id: '5', firstName: 'Eve', lastName: 'Singh', role: 'QA', status: 'active', joinedAt: '2024-11-30' },
  { id: '6', firstName: 'Frank', lastName: 'Wu', role: 'Engineer', status: 'active', joinedAt: '2025-02-09' },
  { id: '7', firstName: 'Grace', lastName: 'Hopper', role: 'Architect', status: 'active', joinedAt: '2022-05-11' },
  { id: '8', firstName: 'Hank', lastName: 'Mendez', role: 'Designer', status: 'inactive', joinedAt: '2023-12-04' },
];

const STATUS_PILL: Record<Person['status'], string> = {
  active: 'bg-positive-01 text-positive-70',
  invited: 'bg-blue-50 text-blue-700',
  inactive: 'bg-gray-100 text-gray-600',
};

function PaginatorDemo() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  return (
    <Paginator
      page={page}
      totalPages={Math.ceil(85 / size)}
      totalRecord={85}
      defaultSize={size}
      onPageChange={(_e, p) => setPage(p)}
      onRecordsPerPageChange={(s) => {
        setSize(s);
        setPage(0);
      }}
    />
  );
}

function TableDemo() {
  const columns = useMemo<ColumnDef<Person, unknown>[]>(
    () => [
      {
        accessorKey: 'firstName',
        header: 'Member',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <UserAvatar
              size={32}
              firstName={row.original.firstName}
              lastName={row.original.lastName}
            />
            <div className="flex flex-col">
              <span className="font-medium">
                {row.original.firstName} {row.original.lastName}
              </span>
              <span className="text-xs text-muted-foreground">{row.original.role}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const s = getValue<Person['status']>();
          return (
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_PILL[s]}`}>
              {s}
            </span>
          );
        },
      },
      { accessorKey: 'joinedAt', header: 'Joined' },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <ActionMenu
            items={[
              { label: 'View', onClick: () => alert(`View ${row.original.firstName}`) },
              { label: 'Edit', onClick: () => alert(`Edit ${row.original.firstName}`) },
              {
                label: 'Remove',
                onClick: () => alert(`Remove ${row.original.firstName}`),
                color: 'rgb(220 38 38)',
              },
            ]}
          />
        ),
      },
    ],
    [],
  );

  return (
    <CommonTable<Person>
      columns={columns}
      data={PEOPLE}
      enableSorting
      enablePagination
      pageSize={5}
    />
  );
}

function AvatarDemo() {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col items-center gap-1">
        <UserAvatar firstName="A" lastName="L" size={24} />
        <span className="text-xs text-muted-foreground">24</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <UserAvatar firstName="B" lastName="S" size={40} />
        <span className="text-xs text-muted-foreground">40</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <UserAvatar firstName="C" lastName="R" size={56} />
        <span className="text-xs text-muted-foreground">56</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <UserAvatar firstName="D" lastName="P" size={80} />
        <span className="text-xs text-muted-foreground">80</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <UserAvatar firstName="E" lastName="S" size={40} variant="soft" />
        <span className="text-xs text-muted-foreground">40 / soft</span>
      </div>
    </div>
  );
}

export function P4Demo() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Data display (P4)</h2>
        <p className="text-sm text-muted-foreground">
          Generic <code>CommonTable</code> on TanStack Table, paginator with rows-per-page select, and user
          avatars. Click a row's action menu to fire row-scoped actions.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">user-avatar</h3>
        <AvatarDemo />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">pagination (standalone)</h3>
        <PaginatorDemo />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          common-table (sorting + pagination + row actions)
        </h3>
        <TableDemo />
      </section>
    </div>
  );
}

export default P4Demo;
