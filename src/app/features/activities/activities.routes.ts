import { Routes } from '@angular/router';

export const ACTIVITIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./activity-list/activity-list.component').then((m) => m.ActivityListComponent),
  },
];
