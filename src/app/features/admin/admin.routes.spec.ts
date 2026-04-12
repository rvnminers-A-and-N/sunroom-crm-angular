import { describe, it, expect } from 'vitest';
import type { Route } from '@angular/router';
import { ADMIN_ROUTES } from './admin.routes';
import { UserManagementComponent } from './user-management/user-management.component';

type RouteWithLazy = Route & { loadComponent: () => Promise<unknown> };

describe('ADMIN_ROUTES', () => {
  it('declares a single route at the empty path', () => {
    expect(ADMIN_ROUTES).toHaveLength(1);
    expect(ADMIN_ROUTES.map((r) => r.path)).toEqual(['']);
  });

  it('lazy-loads UserManagementComponent at the empty path', async () => {
    const route = ADMIN_ROUTES[0] as RouteWithLazy;
    const loaded = await route.loadComponent();
    expect(loaded).toBe(UserManagementComponent);
  });
});
