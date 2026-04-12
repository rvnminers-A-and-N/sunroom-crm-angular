import { describe, it, expect } from 'vitest';
import type { Route } from '@angular/router';
import { DEALS_ROUTES } from './deals.routes';
import { DealListComponent } from './deal-list/deal-list.component';
import { DealPipelineComponent } from './deal-pipeline/deal-pipeline.component';
import { DealDetailComponent } from './deal-detail/deal-detail.component';

type RouteWithLazy = Route & { loadComponent: () => Promise<unknown> };

describe('DEALS_ROUTES', () => {
  it('declares three routes for list, pipeline and detail', () => {
    expect(DEALS_ROUTES).toHaveLength(3);
    expect(DEALS_ROUTES.map((r) => r.path)).toEqual(['', 'pipeline', ':id']);
  });

  it('lazy-loads DealListComponent at the empty path', async () => {
    const route = DEALS_ROUTES[0] as RouteWithLazy;
    const loaded = await route.loadComponent();
    expect(loaded).toBe(DealListComponent);
  });

  it('lazy-loads DealPipelineComponent at the pipeline path', async () => {
    const route = DEALS_ROUTES[1] as RouteWithLazy;
    const loaded = await route.loadComponent();
    expect(loaded).toBe(DealPipelineComponent);
  });

  it('lazy-loads DealDetailComponent at the :id path', async () => {
    const route = DEALS_ROUTES[2] as RouteWithLazy;
    const loaded = await route.loadComponent();
    expect(loaded).toBe(DealDetailComponent);
  });
});
