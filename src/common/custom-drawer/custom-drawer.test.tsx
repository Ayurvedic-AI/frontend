import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomDrawer } from './custom-drawer';

describe('CustomDrawer', () => {
  (['left', 'right', 'top', 'bottom'] as const).forEach((anchor) => {
    it(`renders with anchor="${anchor}"`, () => {
      render(
        <CustomDrawer open anchor={anchor} title={`drawer-${anchor}`} onClose={() => {}}>
          <p>body</p>
        </CustomDrawer>,
      );
      expect(screen.getByText(`drawer-${anchor}`)).toBeInTheDocument();
      expect(screen.getByText('body')).toBeInTheDocument();
      const content = document.querySelector('[data-slot="content"]');
      expect(content).toHaveAttribute('data-anchor', anchor);
    });
  });

  // Radix auto-focuses the close button on open; it must carry the app's
  // focus-visible ring so keyboard-initiated opens don't paint the browser's
  // default black outline.
  it('styles the close button focus-visible state (no UA outline)', () => {
    render(
      <CustomDrawer open anchor="right" title="t" onClose={() => {}}>
        body
      </CustomDrawer>,
    );
    const close = screen.getByRole('button', { name: /close drawer/i });
    expect(close.className).toContain('focus-visible:outline-none');
    expect(close.className).toContain('focus-visible:ring-2');
  });

  it('fires onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <CustomDrawer open anchor="right" title="t" onClose={onClose}>
        body
      </CustomDrawer>,
    );
    await user.click(screen.getByRole('button', { name: /close drawer/i }));
    expect(onClose).toHaveBeenCalled();
  });

  // Feature 046: clicking the dimmed overlay/backdrop must NOT close the drawer (FR-001).
  it('does not fire onClose when the overlay/backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <CustomDrawer open anchor="right" title="t" onClose={onClose}>
        body
      </CustomDrawer>,
    );
    const overlay = document.querySelector('[data-slot="overlay"]') as HTMLElement;
    expect(overlay).toBeInTheDocument();
    await user.click(overlay);
    expect(onClose).not.toHaveBeenCalled();
  });

  // Feature 046: Escape is a deliberate keyboard dismissal and must still close (FR-009).
  it('fires onClose when the Escape key is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <CustomDrawer open anchor="right" title="t" onClose={onClose}>
        body
      </CustomDrawer>,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render content when open is false', () => {
    render(
      <CustomDrawer open={false} anchor="right" title="t" onClose={() => {}}>
        body
      </CustomDrawer>,
    );
    expect(screen.queryByText('body')).not.toBeInTheDocument();
  });
});
