import { Routes } from '@angular/router';

export const DEALS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./deal-list/deal-list.component').then((m) => m.DealListComponent),
  },
  {
    path: 'pipeline',
    loadComponent: () =>
      import('./deal-pipeline/deal-pipeline.component').then((m) => m.DealPipelineComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./deal-detail/deal-detail.component').then((m) => m.DealDetailComponent),
  },
];
