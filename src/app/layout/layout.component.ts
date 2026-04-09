import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="layout">
      <main class="layout__content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .layout {
      display: flex;
      height: 100vh;
    }
    .layout__content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }
  `,
})
export class LayoutComponent {}
