import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import type { MeResponse } from '../../../../sdk/schemas';

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
  useAuthUpdateProfile: (o: unknown) => {
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

import { EditProfileDrawer } from '../EditProfileDrawer';

const user: MeResponse = {
  uuid: '11111111-1111-1111-1111-111111111111',
  email: 'jyoti.varade@example.com',
  role: 'admin',
  is_active: true,
  first_name: 'Jyoti',
  last_name: 'Varade',
  phone: null,
};

describe('EditProfileDrawer', () => {
  beforeEach(() => {
    h.toastMock.mockReset();
    h.handleApiErrorMock.mockReset();
    h.handleApiErrorMock.mockReturnValue(null);
  });

  it('on success shows the backend message (fallback), refreshes, and closes', () => {
    const onUpdated = vi.fn();
    const onClose = vi.fn();
    render(<EditProfileDrawer user={user} open onClose={onClose} onUpdated={onUpdated} />);

    // No backend `message` → fallback copy is shown.
    h.getOpts().mutation?.onSuccess?.({ data: {} });

    expect(h.toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success', message: 'Profile updated.' }),
    );
    expect(onUpdated).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('prefers a backend-provided success message when present', () => {
    render(<EditProfileDrawer user={user} open onClose={vi.fn()} onUpdated={vi.fn()} />);
    h.getOpts().mutation?.onSuccess?.({ data: { message: 'Saved on server.' } });
    expect(h.toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'success', message: 'Saved on server.' }),
    );
  });

  it('on error surfaces a snackbar (backend message via fallback)', () => {
    render(<EditProfileDrawer user={user} open onClose={vi.fn()} onUpdated={vi.fn()} />);
    h.getOpts().mutation?.onError?.({});
    expect(h.toastMock).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
  });
});
