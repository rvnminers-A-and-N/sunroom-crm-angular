import { describe, it, expect } from 'vitest';
import type { Route } from '@angular/router';
import { routes } from './app.routes';
import { authGuard } from '@core/guards/auth.guard';
import { adminGuard } from '@core/guards/admin.guard';
import { AUTH_ROUTES } from '@features/auth/auth.routes';
import { DASHBOARD_ROUTES } from '@features/dashboard/dashboard.routes';
import { CONTACTS_ROUTES } from '@features/contacts/contacts.routes';
import { COMPANIES_ROUTES } from '@features/companies/companies.routes';
import { DEALS_ROUTES } from '@features/deals/deals.routes';
import { ACTIVITIES_ROUTES } from '@features/activities/activities.routes';
import { AI_ROUTES } from '@features/ai/ai.routes';
import { SETTINGS_ROUTES } from '@features/settings/settings.routes';
import { ADMIN_ROUTES } from '@features/admin/admin.routes';
import { LayoutComponent } from './layout/layout.component';

type RouteWithLoadComponent = Route & { loadComponent: () => Promise<unknown> };
type RouteWithLoadChildren = Route & { loadChildren: () => Promise<unknown> };

describe('app routes', () => {
  it('declares the expected top-level path order', () => {
    expect(routes.map((r) => r.path)).toEqual(['auth', '', '**']);
  });

  it('lazy-loads AUTH_ROUTES under the auth path', async () => {
    const auth = routes.find((r) => r.path === 'auth') as RouteWithLoadChildren;
    const loaded = await auth.loadChildren();
    expect(loaded).toBe(AUTH_ROUTES);
  });

  it('redirects unknown URLs back to the empty path', () => {
    const wildcard = routes.find((r) => r.path === '**');
    expect(wildcard?.redirectTo).toBe('');
  });

  it('protects the shell with the auth guard and lazy-loads the layout component', async () => {
    const shell = routes.find((r) => r.path === '') as RouteWithLoadComponent;
    expect(shell.canActivate).toEqual([authGuard]);
    const loaded = await shell.loadComponent();
    expect(loaded).toBe(LayoutComponent);
  });

  it('declares the expected child paths under the shell route', () => {
    const shell = routes.find((r) => r.path === '');
    const childPaths = shell?.children?.map((c) => c.path);
    expect(childPaths).toEqual([
      '',
      'dashboard',
      'contacts',
      'companies',
      'deals',
      'activities',
      'ai',
      'settings',
      'admin',
    ]);
  });

  it('redirects the empty child path to dashboard with full match', () => {
    const shell = routes.find((r) => r.path === '');
    const indexRoute = shell?.children?.find((c) => c.path === '');
    expect(indexRoute?.redirectTo).toBe('dashboard');
    expect(indexRoute?.pathMatch).toBe('full');
  });

  it('lazy-loads each feature module under the shell', async () => {
    const shell = routes.find((r) => r.path === '');
    const children = shell?.children ?? [];

    const cases: { path: string; expected: unknown }[] = [
      { path: 'dashboard', expected: DASHBOARD_ROUTES },
      { path: 'contacts', expected: CONTACTS_ROUTES },
      { path: 'companies', expected: COMPANIES_ROUTES },
      { path: 'deals', expected: DEALS_ROUTES },
      { path: 'activities', expected: ACTIVITIES_ROUTES },
      { path: 'ai', expected: AI_ROUTES },
      { path: 'settings', expected: SETTINGS_ROUTES },
      { path: 'admin', expected: ADMIN_ROUTES },
    ];

    for (const { path, expected } of cases) {
      const child = children.find((c) => c.path === path) as RouteWithLoadChildren;
      const loaded = await child.loadChildren();
      expect(loaded).toBe(expected);
    }
  });

  it('protects the admin child route with the admin guard', () => {
    const shell = routes.find((r) => r.path === '');
    const admin = shell?.children?.find((c) => c.path === 'admin');
    expect(admin?.canActivate).toEqual([adminGuard]);
  });
});
