import { Routes } from '@angular/router';

export const CONTACTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./contact-list/contact-list.component').then((m) => m.ContactListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./contact-detail/contact-detail.component').then((m) => m.ContactDetailComponent),
  },
];
