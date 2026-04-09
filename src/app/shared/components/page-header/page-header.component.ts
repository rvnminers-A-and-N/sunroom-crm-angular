import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="page-header__subtitle">{{ subtitle() }}</p>
        }
      </div>
      @if (actionLabel()) {
        <button mat-flat-button color="primary" (click)="actionClick.emit()">
          <mat-icon>add</mat-icon>
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  styles: `
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      &__title {
        font-size: 24px;
        font-weight: 700;
        color: var(--sr-text);
        margin: 0;
      }

      &__subtitle {
        font-size: 14px;
        color: #6b7280;
        margin: 4px 0 0;
      }
    }
  `,
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>();
  actionLabel = input<string>();
  actionClick = output<void>();
}
