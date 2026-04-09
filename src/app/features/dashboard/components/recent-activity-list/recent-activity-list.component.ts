import { Component, input } from '@angular/core';
import { RecentActivity } from '@core/models/dashboard.model';
import { ActivityIconComponent } from '@shared/components/activity-icon/activity-icon.component';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-recent-activity-list',
  standalone: true,
  imports: [ActivityIconComponent, RelativeTimePipe],
  template: `
    <div class="activity-list sr-card">
      <h3 class="activity-list__title">Recent Activity</h3>
      @for (activity of activities(); track activity.id) {
        <div class="activity-list__item">
          <app-activity-icon [type]="activity.type" />
          <div class="activity-list__info">
            <span class="activity-list__subject">{{ activity.subject }}</span>
            <span class="activity-list__meta">
              {{ activity.userName }}
              @if (activity.contactName) {
                &middot; {{ activity.contactName }}
              }
            </span>
          </div>
          <span class="activity-list__time">{{ activity.occurredAt | relativeTime }}</span>
        </div>
      } @empty {
        <p class="activity-list__empty">No recent activity</p>
      }
    </div>
  `,
  styles: `
    .activity-list {
      padding: 20px;

      &__title {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 16px;
        color: var(--sr-text);
      }

      &__item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 0;
        border-bottom: 1px solid #f3f4f6;

        &:last-child {
          border-bottom: none;
        }
      }

      &__info {
        flex: 1;
        min-width: 0;
      }

      &__subject {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: var(--sr-text);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      &__meta {
        display: block;
        font-size: 12px;
        color: #9ca3af;
      }

      &__time {
        font-size: 12px;
        color: #9ca3af;
        white-space: nowrap;
        flex-shrink: 0;
      }

      &__empty {
        text-align: center;
        color: #9ca3af;
        font-size: 14px;
        padding: 24px 0;
      }
    }
  `,
})
export class RecentActivityListComponent {
  activities = input.required<RecentActivity[]>();
}
