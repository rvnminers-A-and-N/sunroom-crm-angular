import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ActivityService } from '../services/activity.service';
import { ContactService } from '@features/contacts/services/contact.service';
import { DealService } from '@features/deals/services/deal.service';
import { NotificationService } from '@core/services/notification.service';
import { Activity, ActivityType } from '@core/models/activity.model';
import { Contact } from '@core/models/contact.model';
import { Deal } from '@core/models/deal.model';

@Component({
  selector: 'app-activity-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './activity-form-dialog.component.html',
  styleUrl: './activity-form-dialog.component.scss',
})
export class ActivityFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ActivityFormDialogComponent>);
  private activityService = inject(ActivityService);
  private contactService = inject(ContactService);
  private dealService = inject(DealService);
  private notification = inject(NotificationService);
  data = inject<Activity | null>(MAT_DIALOG_DATA);

  saving = signal(false);
  contacts = signal<Contact[]>([]);
  deals = signal<Deal[]>([]);
  isEdit = !!this.data;
  types: ActivityType[] = ['Note', 'Call', 'Email', 'Meeting', 'Task'];

  form = this.fb.nonNullable.group({
    type: [this.data?.type ?? 'Note', Validators.required],
    subject: [this.data?.subject ?? '', Validators.required],
    body: [this.data?.body ?? ''],
    contactId: [this.data?.contactId as number | null],
    dealId: [this.data?.dealId as number | null],
    occurredAt: [this.data ? new Date(this.data.occurredAt) : new Date()],
  });

  ngOnInit(): void {
    this.contactService
      .getContacts({ page: 1, perPage: 200 })
      .subscribe((res) => this.contacts.set(res.data));
    this.dealService
      .getDeals({ page: 1, perPage: 200 })
      .subscribe((res) => this.deals.set(res.data));
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const raw = this.form.getRawValue();
    const value = {
      ...raw,
      contactId: raw.contactId || undefined,
      dealId: raw.dealId || undefined,
      occurredAt: raw.occurredAt ? raw.occurredAt.toISOString() : undefined,
    };

    if (this.isEdit) {
      this.activityService.updateActivity(this.data!.id, value).subscribe({
        next: () => {
          this.notification.success('Activity updated');
          this.dialogRef.close(true);
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.activityService.createActivity(value).subscribe({
        next: () => {
          this.notification.success('Activity created');
          this.dialogRef.close(true);
        },
        error: () => this.saving.set(false),
      });
    }
  }
}
