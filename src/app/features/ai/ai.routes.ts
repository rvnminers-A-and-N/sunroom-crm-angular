import { Routes } from '@angular/router';

export const AI_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./ai-panel/ai-panel.component').then((m) => m.AiPanelComponent),
  },
];
