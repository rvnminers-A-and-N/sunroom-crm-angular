import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="empty-state">
      <mat-icon class="empty-state__icon">{{ icon() }}</mat-icon>
      <h3 class="empty-state__title">{{ title() }}</h3>
      <p class="empty-state__message">{{ message() }}</p>
      @if (actionLabel()) {
        <button mat-flat-button color="primary" (click)="actionClick.emit()">
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  styles: `
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;

      &__icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #d1d5db;
        margin-bottom: 16px;
      }

      &__title {
        font-size: 18px;
        font-weight: 600;
        color: var(--sr-text);
        margin: 0 0 8px;
      }

      &__message {
        font-size: 14px;
        color: #6b7280;
        margin: 0 0 24px;
        max-width: 400px;
      }
    }
  `,
})
export class EmptyStateComponent {
  icon = input('inbox');
  title = input('No data');
  message = input('Nothing to show here yet.');
  actionLabel = input<string>();
  actionClick = output<void>();
}
