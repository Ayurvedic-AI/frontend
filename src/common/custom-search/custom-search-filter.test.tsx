import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchFilter from './custom-search-filter';

const baseProps = {
  textData: { placeholder: 'Search…', btnTitle: 'Search' },
};

describe('CustomSearch (SearchFilter)', () => {
  it('renders the search input with placeholder', () => {
    render(<SearchFilter {...baseProps} />);
    expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument();
  });

  it('updates the displayed value as the user types', async () => {
    const user = userEvent.setup();
    render(<SearchFilter {...baseProps} />);
    const input = screen.getByPlaceholderText('Search…') as HTMLInputElement;
    await user.type(input, 'hello');
    expect(input.value).toBe('hello');
  });

  it('fires onSearch (debounced) with the latest value', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchFilter {...baseProps} onSearch={onSearch} debounceMs={50} />);
    await user.type(screen.getByPlaceholderText('Search…'), 'svap');
    await waitFor(() => expect(onSearch).toHaveBeenCalledWith('svap'), { timeout: 1000 });
  });
});
