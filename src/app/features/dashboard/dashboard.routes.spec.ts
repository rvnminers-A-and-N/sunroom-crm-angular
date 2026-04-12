import { describe, it, expect } from 'vitest';
import type { Route } from '@angular/router';
import { DASHBOARD_ROUTES } from './dashboard.routes';
import { DashboardComponent } from './dashboard.component';

type RouteWithLazy = Route & { loadComponent: () => Promise<unknown> };

describe('DASHBOARD_ROUTES', () => {
  it('declares a single route at the empty path', () => {
    expect(DASHBOARD_ROUTES).toHaveLength(1);
    expect(DASHBOARD_ROUTES.map((r) => r.path)).toEqual(['']);
  });

  it('lazy-loads DashboardComponent at the empty path', async () => {
    const route = DASHBOARD_ROUTES[0] as RouteWithLazy;
    const loaded = await route.loadComponent();
    expect(loaded).toBe(DashboardComponent);
  });
});
