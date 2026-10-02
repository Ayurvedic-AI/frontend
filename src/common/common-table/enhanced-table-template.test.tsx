import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommonTable, type ColumnDef } from './enhanced-table-template';

interface Row {
  id: string;
  name: string;
  age: number;
}

const data: Row[] = [
  { id: '1', name: 'Alice', age: 30 },
  { id: '2', name: 'Bob', age: 25 },
  { id: '3', name: 'Carol', age: 41 },
];

const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'age', header: 'Age' },
];

describe('CommonTable', () => {
  it('renders headers + rows', () => {
    render(<CommonTable columns={columns} data={data} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Carol')).toBeInTheDocument();
  });

  it('renders the empty state when data is empty', () => {
    render(<CommonTable columns={columns} data={[]} emptyState="Nothing here." />);
    expect(screen.getByText('Nothing here.')).toBeInTheDocument();
  });

  it('renders the skeleton when loading', () => {
    render(<CommonTable columns={columns} data={data} loading />);
    expect(screen.getByLabelText('loading table')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('fires onRowClick with the original row', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<CommonTable columns={columns} data={data} onRowClick={onRowClick} />);
    await user.click(screen.getByText('Alice'));
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it('renders pagination when enablePagination is true and pages exist', () => {
    render(
      <CommonTable
        columns={columns}
        data={data}
        enablePagination
        pageSize={2}
      />,
    );
    expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
  });

  it('renders an expanded panel row when renderExpanded returns content', () => {
    render(
      <CommonTable
        columns={columns}
        data={data}
        renderExpanded={(row) => (row.id === data[0].id ? <div>EXPANDED-PANEL</div> : null)}
      />,
    );
    expect(screen.getByText('EXPANDED-PANEL')).toBeInTheDocument();
    // exactly one expanded row rendered
    expect(screen.getAllByText('EXPANDED-PANEL')).toHaveLength(1);
  });
});
