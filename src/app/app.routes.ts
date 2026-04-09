import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { adminGuard } from '@core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('@features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('@features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'contacts',
        loadChildren: () =>
          import('@features/contacts/contacts.routes').then((m) => m.CONTACTS_ROUTES),
      },
      {
        path: 'companies',
        loadChildren: () =>
          import('@features/companies/companies.routes').then((m) => m.COMPANIES_ROUTES),
      },
      {
        path: 'deals',
        loadChildren: () => import('@features/deals/deals.routes').then((m) => m.DEALS_ROUTES),
      },
      {
        path: 'activities',
        loadChildren: () =>
          import('@features/activities/activities.routes').then((m) => m.ACTIVITIES_ROUTES),
      },
      {
        path: 'ai',
        loadChildren: () => import('@features/ai/ai.routes').then((m) => m.AI_ROUTES),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('@features/settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadChildren: () => import('@features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
