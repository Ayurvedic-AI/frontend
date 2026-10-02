import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Paginator } from './pagination';

const baseProps = {
  page: 0,
  totalPages: 5,
  totalRecord: 50,
  onPageChange: vi.fn(),
};

describe('Paginator', () => {
  it('renders nothing when totalPages is 0', () => {
    const { container } = render(<Paginator {...baseProps} totalPages={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the record-range summary on sm+ viewports', () => {
    render(<Paginator {...baseProps} page={1} defaultSize={10} />);
    expect(screen.getByText('11-20')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('marks the current page with aria-current="page"', () => {
    render(<Paginator {...baseProps} page={2} />);
    const current = screen.getByRole('button', { name: 'Page 3' });
    expect(current).toHaveAttribute('aria-current', 'page');
  });

  it('fires onPageChange with the 0-based page index when a page button is clicked', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Paginator {...baseProps} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: 'Page 3' }));
    expect(onPageChange).toHaveBeenCalledWith(expect.anything(), 2);
  });

  it('disables Previous on first page and Next on last page', () => {
    const { rerender } = render(<Paginator {...baseProps} page={0} />);
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
    rerender(<Paginator {...baseProps} page={4} />);
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
  });

  it('fires onRecordsPerPageChange and resets to page 0 when the page size changes', async () => {
    const user = userEvent.setup();
    const onRecordsPerPageChange = vi.fn();
    const onPageChange = vi.fn();
    render(
      <Paginator
        {...baseProps}
        page={2}
        onPageChange={onPageChange}
        onRecordsPerPageChange={onRecordsPerPageChange}
      />,
    );
    await user.selectOptions(screen.getByLabelText('Rows per page'), '20');
    expect(onRecordsPerPageChange).toHaveBeenCalledWith(20);
    expect(onPageChange).toHaveBeenCalledWith(null, 0);
  });

  it('shows a page size that is not one of the presets and lets the user change it (#162/#163)', async () => {
    const user = userEvent.setup();
    const onRecordsPerPageChange = vi.fn();
    render(
      <Paginator
        {...baseProps}
        defaultSize={25}
        onPageChange={vi.fn()}
        onRecordsPerPageChange={onRecordsPerPageChange}
      />,
    );
    const select = screen.getByLabelText('Rows per page') as HTMLSelectElement;
    // 25 (not in [5,10,20,50,100]) is offered AND is the current value.
    expect(screen.getByRole('option', { name: '25' })).toBeInTheDocument();
    expect(select.value).toBe('25');
    // Picking 5 now actually changes the value and fires the handler.
    await user.selectOptions(select, '5');
    expect(onRecordsPerPageChange).toHaveBeenCalledWith(5);
  });
});
