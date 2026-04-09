import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="stat-card sr-card">
      <div class="stat-card__icon" [style.background]="iconBg()">
        <mat-icon [style.color]="iconColor()">{{ icon() }}</mat-icon>
      </div>
      <div class="stat-card__info">
        <span class="stat-card__value">{{ value() }}</span>
        <span class="stat-card__label">{{ label() }}</span>
      </div>
    </div>
  `,
  styles: `
    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;

      &__icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      &__info {
        display: flex;
        flex-direction: column;
      }

      &__value {
        font-size: 24px;
        font-weight: 700;
        color: var(--sr-text);
        line-height: 1.2;
      }

      &__label {
        font-size: 13px;
        color: #6b7280;
        margin-top: 2px;
      }
    }
  `,
})
export class StatCardComponent {
  icon = input.required<string>();
  label = input.required<string>();
  value = input.required<string | number>();
  iconBg = input('rgba(2, 121, 95, 0.1)');
  iconColor = input('var(--sr-primary)');
}
