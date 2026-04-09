import { Component, input, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

const ICON_MAP: Record<string, { icon: string; color: string }> = {
  Note: { icon: 'description', color: '#6b7280' },
  Call: { icon: 'phone', color: '#3b82f6' },
  Email: { icon: 'email', color: '#f9a66c' },
  Meeting: { icon: 'groups', color: '#02795f' },
  Task: { icon: 'check_circle', color: '#f76c6c' },
};

@Component({
  selector: 'app-activity-icon',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <mat-icon
      class="activity-icon"
      [style.color]="config().color"
    >{{ config().icon }}</mat-icon>
  `,
  styles: `
    .activity-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `,
})
export class ActivityIconComponent {
  type = input.required<string>();
  config = computed(() => ICON_MAP[this.type()] ?? { icon: 'event', color: '#6b7280' });
}
