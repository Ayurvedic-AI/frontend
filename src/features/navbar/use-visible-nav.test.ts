import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Nav hides items the user can't view; a group with no visible items is dropped.
let mockPermissions: string[] = [];
vi.mock('../auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uuid: 'u', email: 'x', role: 'r', is_active: true, permissions: mockPermissions } }),
}));

import { useVisibleNavGroups, useVisibleNavLinks } from './use-visible-nav';

const labels = (groups: ReturnType<typeof useVisibleNavGroups>) =>
  groups.flatMap((g) => g.links.map((l) => l.label));

describe('useVisibleNavGroups', () => {
  beforeEach(() => {
    mockPermissions = [];
  });

  it('shows the Dashboard tab for a user with dashboard.view', () => {
    mockPermissions = ['dashboard.view'];
    const { result } = renderHook(() => useVisibleNavGroups());
    expect(labels(result.current)).toEqual(['Dashboard']);
  });

  it('drops a group entirely when none of its items are visible', () => {
    mockPermissions = ['students.view'];
    const { result } = renderHook(() => useVisibleNavGroups());
    expect(result.current).toEqual([]);
  });

  it('flat visible links match the visible groups', () => {
    mockPermissions = ['dashboard.view'];
    const groups = renderHook(() => useVisibleNavGroups()).result.current;
    const links = renderHook(() => useVisibleNavLinks()).result.current;
    expect(links.map((l) => l.path)).toEqual(groups.flatMap((g) => g.links.map((l) => l.path)));
  });
});
