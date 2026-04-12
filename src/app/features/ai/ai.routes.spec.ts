import { describe, it, expect } from 'vitest';
import type { Route } from '@angular/router';
import { AI_ROUTES } from './ai.routes';
import { AiPanelComponent } from './ai-panel/ai-panel.component';

type RouteWithLazy = Route & { loadComponent: () => Promise<unknown> };

describe('AI_ROUTES', () => {
  it('declares a single route at the empty path', () => {
    expect(AI_ROUTES).toHaveLength(1);
    expect(AI_ROUTES.map((r) => r.path)).toEqual(['']);
  });

  it('lazy-loads AiPanelComponent at the empty path', async () => {
    const route = AI_ROUTES[0] as RouteWithLazy;
    const loaded = await route.loadComponent();
    expect(loaded).toBe(AiPanelComponent);
  });
});
