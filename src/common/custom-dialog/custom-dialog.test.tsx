import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomDialog } from './custom-dialog';

describe('CustomDialog', () => {
  it('renders the title and children when open', () => {
    render(
      <CustomDialog title="Hello" open onClose={() => {}}>
        <p>body</p>
      </CustomDialog>,
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    render(
      <CustomDialog title="Hello" open={false} onClose={() => {}}>
        <p>body</p>
      </CustomDialog>,
    );
    expect(screen.queryByText('body')).not.toBeInTheDocument();
  });

  it('fires onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <CustomDialog title="Hello" open onClose={onClose}>
        body
      </CustomDialog>,
    );
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('fires onClose with reason="escapeKeyDown" when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <CustomDialog title="Hello" open onClose={onClose}>
        body
      </CustomDialog>,
    );
    await user.keyboard('{Escape}');
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const args = onClose.mock.calls[0];
    expect(args[1]).toBe('escapeKeyDown');
  });
});
