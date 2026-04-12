import { describe, it, expect } from 'vitest';
import type { Route } from '@angular/router';
import { SETTINGS_ROUTES } from './settings.routes';
import { ProfileComponent } from './profile/profile.component';

type RouteWithLazy = Route & { loadComponent: () => Promise<unknown> };

describe('SETTINGS_ROUTES', () => {
  it('declares a single route at the empty path', () => {
    expect(SETTINGS_ROUTES).toHaveLength(1);
    expect(SETTINGS_ROUTES.map((r) => r.path)).toEqual(['']);
  });

  it('lazy-loads ProfileComponent at the empty path', async () => {
    const route = SETTINGS_ROUTES[0] as RouteWithLazy;
    const loaded = await route.loadComponent();
    expect(loaded).toBe(ProfileComponent);
  });
});
