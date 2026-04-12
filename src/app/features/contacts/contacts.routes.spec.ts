import { describe, it, expect } from 'vitest';
import type { Route } from '@angular/router';
import { CONTACTS_ROUTES } from './contacts.routes';
import { ContactListComponent } from './contact-list/contact-list.component';
import { ContactDetailComponent } from './contact-detail/contact-detail.component';

type RouteWithLazy = Route & { loadComponent: () => Promise<unknown> };

describe('CONTACTS_ROUTES', () => {
  it('declares two routes for list and detail', () => {
    expect(CONTACTS_ROUTES).toHaveLength(2);
    expect(CONTACTS_ROUTES.map((r) => r.path)).toEqual(['', ':id']);
  });

  it('lazy-loads ContactListComponent at the empty path', async () => {
    const route = CONTACTS_ROUTES[0] as RouteWithLazy;
    const loaded = await route.loadComponent();
    expect(loaded).toBe(ContactListComponent);
  });

  it('lazy-loads ContactDetailComponent at the :id path', async () => {
    const route = CONTACTS_ROUTES[1] as RouteWithLazy;
    const loaded = await route.loadComponent();
    expect(loaded).toBe(ContactDetailComponent);
  });
});
