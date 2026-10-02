import { describe, expect, it } from 'vitest';
import { createPermissionApi } from './use-permissions';

describe('createPermissionApi', () => {
  it('denies everything for an empty set', () => {
    const p = createPermissionApi([]);
    expect(p.has('crm.view')).toBe(false);
    expect(p.canView('crm')).toBe(false);
    expect(p.hasAny(['crm.view', 'sales.view'])).toBe(false);
    expect(p.hasAll(['crm.view'])).toBe(false);
    expect(p.permissions.size).toBe(0);
  });

  it('resolves can(feature, action) against the dotted string', () => {
    const p = createPermissionApi(['crm.view', 'crm.create']);
    expect(p.can('crm', 'view')).toBe(true);
    expect(p.canCreate('crm')).toBe(true);
    expect(p.canUpdate('crm')).toBe(false);
    expect(p.canDelete('crm')).toBe(false);
  });

  it('hasAny / hasAll behave correctly', () => {
    const p = createPermissionApi(['payments.view', 'payments.create']);
    expect(p.hasAny(['payments.view', 'users.view'])).toBe(true);
    expect(p.hasAll(['payments.view', 'payments.create'])).toBe(true);
    expect(p.hasAll(['payments.view', 'payments.delete'])).toBe(false);
  });

  it('grants everything an admin-full set contains', () => {
    const full = ['dashboard.view', 'users.view', 'roles.view', 'payments.delete'];
    const p = createPermissionApi(full);
    expect(p.has('roles.view')).toBe(true);
    expect(p.canDelete('payments')).toBe(true);
    expect(p.hasAll(full)).toBe(true);
  });

  it('accepts an existing Set without re-copying semantics breaking', () => {
    const p = createPermissionApi(new Set(['sales.view']));
    expect(p.has('sales.view')).toBe(true);
    expect(p.has('sales.create')).toBe(false);
  });
});
