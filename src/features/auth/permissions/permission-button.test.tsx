import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// US4: an action the user lacks is visible but disabled and non-triggerable;
// an action they hold is enabled and fires.
let mockPermissions: string[] = [];
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { permissions: mockPermissions } }),
}));

import { PermissionButton } from './permission-button';

describe('PermissionButton (US4)', () => {
  beforeEach(() => {
    mockPermissions = [];
  });

  it('renders enabled and fires onClick when the permission is held', async () => {
    mockPermissions = ['payments.create'];
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <PermissionButton permission="payments.create" onClick={onClick}>
        New Payment
      </PermissionButton>,
    );
    const btn = screen.getByRole('button', { name: /new payment/i });
    expect(btn).not.toBeDisabled();
    await user.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders disabled and does NOT fire onClick when the permission is missing', async () => {
    mockPermissions = ['payments.view'];
    const onClick = vi.fn();
    // pointerEventsCheck: 0 lets us attempt a click on the pointer-events-none
    // disabled control to prove it does not fire.
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <PermissionButton permission="payments.create" onClick={onClick}>
        New Payment
      </PermissionButton>,
    );
    const btn = screen.getByRole('button', { name: /new payment/i });
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});
