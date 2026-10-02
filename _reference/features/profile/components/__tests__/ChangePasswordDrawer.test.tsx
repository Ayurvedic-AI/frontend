import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ApiError } from '../../../../api/client';

const h = vi.hoisted(() => {
  let opts: { mutation?: { onSuccess?: (r: unknown) => void; onError?: (e: unknown) => void } } = {};
  return {
    toastMock: vi.fn(),
    handleApiErrorMock: vi.fn(() => null as string | null),
    setOpts: (o: typeof opts) => {
      opts = o;
    },
    getOpts: () => opts,
  };
});

vi.mock('../../../../sdk/authentication', () => ({
  useAuthChangePassword: (o: unknown) => {
    h.setOpts(o as never);
    return { mutate: vi.fn(), isPending: false };
  },
}));
vi.mock('../../../../common/common-snackbar', () => ({
  useToast: () => ({ toast: h.toastMock, dismiss: vi.fn() }),
}));
vi.mock('../../../../hooks/useFormApiErrors', () => ({
  useFormApiErrors: () => ({ handleApiError: h.handleApiErrorMock }),
}));

import { ChangePasswordDrawer } from '../ChangePasswordDrawer';

describe('ChangePasswordDrawer', () => {
  beforeEach(() => {
    h.toastMock.mockReset();
    h.handleApiErrorMock.mockReset();
    h.handleApiErrorMock.mockReturnValue(null);
  });

  it('on success (204, no body) shows the fallback message and closes', () => {
    const onClose = vi.fn();
    render(<ChangePasswordDrawer open onClose={onClose} />);
    h.getOpts().mutation?.onSuccess?.({ status: 204 });
    expect(h.toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success', message: 'Password changed successfully.' }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('maps a 401 to the current-password field and shows an error snackbar', async () => {
    render(<ChangePasswordDrawer open onClose={vi.fn()} />);
    h.getOpts().mutation?.onError?.(new ApiError(401, { detail: 'wrong' }));

    expect(h.toastMock).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    await waitFor(() =>
      expect(screen.getByText('Current password is incorrect.')).toBeInTheDocument(),
    );
  });

  it('shows requirement hints for the new password', () => {
    render(<ChangePasswordDrawer open onClose={vi.fn()} />);
    expect(screen.getByText(/At least 10 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/3 of: lowercase, uppercase, number, symbol/i)).toBeInTheDocument();
  });
});
