import { describe, it, expect } from 'vitest';
import type { Route } from '@angular/router';
import { ACTIVITIES_ROUTES } from './activities.routes';
import { ActivityListComponent } from './activity-list/activity-list.component';

type RouteWithLazy = Route & { loadComponent: () => Promise<unknown> };

describe('ACTIVITIES_ROUTES', () => {
  it('declares a single route at the empty path', () => {
    expect(ACTIVITIES_ROUTES).toHaveLength(1);
    expect(ACTIVITIES_ROUTES.map((r) => r.path)).toEqual(['']);
  });

  it('lazy-loads ActivityListComponent at the empty path', async () => {
    const route = ACTIVITIES_ROUTES[0] as RouteWithLazy;
    const loaded = await route.loadComponent();
    expect(loaded).toBe(ActivityListComponent);
  });
});
