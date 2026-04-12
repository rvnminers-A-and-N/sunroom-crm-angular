import { describe, it, expect } from 'vitest';
import type { Route } from '@angular/router';
import { COMPANIES_ROUTES } from './companies.routes';
import { CompanyListComponent } from './company-list/company-list.component';
import { CompanyDetailComponent } from './company-detail/company-detail.component';

type RouteWithLazy = Route & { loadComponent: () => Promise<unknown> };

describe('COMPANIES_ROUTES', () => {
  it('declares two routes for list and detail', () => {
    expect(COMPANIES_ROUTES).toHaveLength(2);
    expect(COMPANIES_ROUTES.map((r) => r.path)).toEqual(['', ':id']);
  });

  it('lazy-loads CompanyListComponent at the empty path', async () => {
    const route = COMPANIES_ROUTES[0] as RouteWithLazy;
    const loaded = await route.loadComponent();
    expect(loaded).toBe(CompanyListComponent);
  });

  it('lazy-loads CompanyDetailComponent at the :id path', async () => {
    const route = COMPANIES_ROUTES[1] as RouteWithLazy;
    const loaded = await route.loadComponent();
    expect(loaded).toBe(CompanyDetailComponent);
  });
});
