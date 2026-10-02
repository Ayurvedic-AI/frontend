import { describe, expect, it } from 'vitest';
import { orderFeaturesBySidebar } from './feature-order';

const row = (feature: string) => ({ feature });

describe('orderFeaturesBySidebar', () => {
  it('reorders the backend catalog order into sidebar order', () => {
    // Backend (seed) order, abbreviated.
    const backend = ['dashboard', 'users', 'roles', 'activity_log', 'inventory', 'crm', 'masters', 'announcements'].map(row);
    const ordered = orderFeaturesBySidebar(backend).map((r) => r.feature);
    expect(ordered).toEqual([
      'dashboard',
      'inventory',
      'crm',
      'masters',
      'users',
      'roles',
      'announcements',
      'activity_log',
    ]);
  });

  it('orders the full 068-era catalog into sidebar order', () => {
    // Backend (seed/catalog) order after the 068 realignment — all 19 features.
    const backend = [
      'dashboard',
      'users',
      'roles',
      'activity_log',
      'inventory',
      'production',
      'masters',
      'category_types',
      'store_types',
      'crm',
      'crm_phone',
      'message_templates',
      'follow_ups',
      'sales',
      'payments',
      'purchasing',
      'returns',
      'reports',
      'announcements',
    ].map(row);
    const ordered = orderFeaturesBySidebar(backend).map((r) => r.feature);
    expect(ordered).toEqual([
      'dashboard',
      'inventory',
      'production',
      'sales',
      'purchasing',
      'returns',
      'payments',
      'crm',
      'crm_phone',
      'message_templates',
      'follow_ups',
      'reports',
      'masters',
      'category_types',
      'store_types',
      'users',
      'roles',
      'announcements',
      'activity_log',
    ]);
  });

  it('keeps unknown features at the end in their original order', () => {
    const rows = ['mystery_b', 'users', 'mystery_a', 'dashboard'].map(row);
    const ordered = orderFeaturesBySidebar(rows).map((r) => r.feature);
    expect(ordered).toEqual(['dashboard', 'users', 'mystery_b', 'mystery_a']);
  });

  it('does not mutate the input array', () => {
    const rows = ['users', 'dashboard'].map(row);
    const copy = [...rows];
    orderFeaturesBySidebar(rows);
    expect(rows).toEqual(copy);
  });
});
