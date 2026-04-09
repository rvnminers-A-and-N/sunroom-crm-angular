import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { ActivityService } from '../services/activity.service';
import { NotificationService } from '@core/services/notification.service';
import { Activity, ActivityType } from '@core/models/activity.model';
import { PaginationMeta } from '@core/models/pagination.model';
import { ActivityIconComponent } from '@shared/components/activity-icon/activity-icon.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ActivityFormDialogComponent } from '../activity-form-dialog/activity-form-dialog.component';

@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    ActivityIconComponent,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './activity-list.component.html',
  styleUrl: './activity-list.component.scss',
})
export class ActivityListComponent implements OnInit {
  private activityService = inject(ActivityService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  activities = signal<Activity[]>([]);
  meta = signal<PaginationMeta>({ currentPage: 1, perPage: 10, total: 0, lastPage: 1 });
  loading = signal(true);

  selectedType = '';
  displayedColumns = ['type', 'subject', 'contact', 'deal', 'occurredAt', 'actions'];
  types: ActivityType[] = ['Note', 'Call', 'Email', 'Meeting', 'Task'];

  ngOnInit(): void {
    this.loadActivities();
  }

  loadActivities(): void {
    this.loading.set(true);
    const m = this.meta();
    this.activityService
      .getActivities({
        page: m.currentPage,
        perPage: m.perPage,
        type: this.selectedType || undefined,
      })
      .subscribe({
        next: (res) => {
          this.activities.set(res.data);
          this.meta.set(res.meta);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onTypeFilter(type: string): void {
    this.selectedType = type;
    this.meta.update((m) => ({ ...m, currentPage: 1 }));
    this.loadActivities();
  }

  onPage(event: PageEvent): void {
    this.meta.update((m) => ({
      ...m,
      currentPage: event.pageIndex + 1,
      perPage: event.pageSize,
    }));
    this.loadActivities();
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(ActivityFormDialogComponent, {
      width: '500px',
      data: null,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadActivities();
    });
  }

  openEditDialog(activity: Activity, event: MouseEvent): void {
    event.stopPropagation();
    const ref = this.dialog.open(ActivityFormDialogComponent, {
      width: '500px',
      data: activity,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadActivities();
    });
  }

  confirmDelete(activity: Activity, event: MouseEvent): void {
    event.stopPropagation();
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Activity',
        message: `Are you sure you want to delete "${activity.subject}"?`,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.activityService.deleteActivity(activity.id).subscribe(() => {
          this.notification.success('Activity deleted');
          this.loadActivities();
        });
      }
    });
  }
}
