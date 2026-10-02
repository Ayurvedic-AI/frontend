import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomButton } from './custom-buttons';

describe('CustomButton', () => {
  it('renders children', () => {
    render(<CustomButton>Click me</CustomButton>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('exposes the selected variant and size as data attributes', () => {
    render(
      <CustomButton variant="destructive" size="lg">
        Delete
      </CustomButton>,
    );
    const btn = screen.getByRole('button', { name: 'Delete' });
    expect(btn).toHaveAttribute('data-variant', 'destructive');
    expect(btn).toHaveAttribute('data-size', 'lg');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<CustomButton onClick={onClick}>Save</CustomButton>);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when loading; renders a spinner', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <CustomButton onClick={onClick} loading>
        Save
      </CustomButton>,
    );
    const btn = screen.getByRole('button', { name: /Save/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn.querySelector('[data-slot="spinner"]')).not.toBeNull();
    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <CustomButton onClick={onClick} disabled>
        Save
      </CustomButton>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('forwards click through the immediate child when asChild is true', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <CustomButton asChild>
        <a href="#dest" onClick={onClick} data-testid="anchor">
          Go
        </a>
      </CustomButton>,
    );
    // The rendered element is the <a>, not a <button>.
    const anchor = screen.getByTestId('anchor');
    expect(anchor.tagName).toBe('A');
    await user.click(anchor);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('supports the success variant', () => {
    render(<CustomButton variant="success">Close order</CustomButton>);
    const btn = screen.getByRole('button', { name: 'Close order' });
    expect(btn).toHaveAttribute('data-variant', 'success');
    expect(btn.className).toContain('bg-positive');
  });
});
