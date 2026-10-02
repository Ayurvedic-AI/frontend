import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// US3: route guard renders the 403 page in place when the user lacks the
// permission, and renders the protected content when they hold it.
let mockPermissions: string[] = [];
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { permissions: mockPermissions } }),
}));

import { RequirePermission } from './require-permission';
import { firstPermittedPath } from './landing';

const renderGuard = (permission: string) =>
  render(
    <MemoryRouter>
      <RequirePermission permission={permission}>
        <div>SECRET CONTENT</div>
      </RequirePermission>
    </MemoryRouter>,
  );

describe('RequirePermission (US3)', () => {
  beforeEach(() => {
    mockPermissions = [];
  });

  it('renders the protected content when the permission is held', () => {
    mockPermissions = ['inventory.view'];
    renderGuard('inventory.view');
    expect(screen.getByText('SECRET CONTENT')).toBeInTheDocument();
    expect(screen.queryByText(/no access/i)).not.toBeInTheDocument();
  });

  it('renders the 403 page (not the content) when the permission is missing', () => {
    mockPermissions = ['payments.view'];
    renderGuard('inventory.view');
    expect(screen.queryByText('SECRET CONTENT')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /no access/i })).toBeInTheDocument();
  });
});

describe('firstPermittedPath (US3 landing)', () => {
  it('returns null for an empty permission set (→ no-access screen)', () => {
    expect(firstPermittedPath(new Set())).toBeNull();
  });

  it('returns null when the user holds no nav-mapped permission', () => {
    expect(firstPermittedPath(new Set(['students.create']))).toBeNull();
  });

  it('returns the first nav path the user can view', () => {
    expect(firstPermittedPath(new Set(['dashboard.view', 'students.view']))).toBe('/dashboard');
  });
});
