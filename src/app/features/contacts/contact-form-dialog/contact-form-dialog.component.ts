import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ContactService } from '../services/contact.service';
import { NotificationService } from '@core/services/notification.service';
import { Contact } from '@core/models/contact.model';
import { Company } from '@core/models/company.model';
import { Tag } from '@core/models/tag.model';
import { TagService } from '@core/services/tag.service';
import { ApiService } from '@core/services/api.service';
import { PaginatedResponse } from '@core/models/pagination.model';

@Component({
  selector: 'app-contact-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './contact-form-dialog.component.html',
  styleUrl: './contact-form-dialog.component.scss',
})
export class ContactFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ContactFormDialogComponent>);
  private contactService = inject(ContactService);
  private tagService = inject(TagService);
  private apiService = inject(ApiService);
  private notification = inject(NotificationService);
  data = inject<Contact | null>(MAT_DIALOG_DATA);

  companies = signal<Company[]>([]);
  tags = signal<Tag[]>([]);
  saving = signal(false);

  isEdit = !!this.data;

  form = this.fb.nonNullable.group({
    firstName: [this.data?.firstName ?? '', Validators.required],
    lastName: [this.data?.lastName ?? '', Validators.required],
    email: [this.data?.email ?? ''],
    phone: [this.data?.phone ?? ''],
    title: [this.data?.title ?? ''],
    notes: [''],
    companyId: [this.data?.companyId as number | null],
    tagIds: [this.data?.tags?.map((t) => t.id) ?? [] as number[]],
  });

  ngOnInit(): void {
    this.tagService.getTags().subscribe((tags) => this.tags.set(tags));
    this.apiService
      .get<PaginatedResponse<Company>>('/companies?perPage=100')
      .subscribe((res) => this.companies.set(res.data));
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const value = this.form.getRawValue();

    if (this.isEdit) {
      const { tagIds, ...updateData } = value;
      this.contactService.updateContact(this.data!.id, {
        ...updateData,
        companyId: updateData.companyId ?? undefined,
      }).subscribe({
        next: () => {
          this.notification.success('Contact updated');
          this.dialogRef.close(true);
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.contactService.createContact({
        ...value,
        companyId: value.companyId ?? undefined,
        tagIds: value.tagIds.length > 0 ? value.tagIds : undefined,
      }).subscribe({
        next: () => {
          this.notification.success('Contact created');
          this.dialogRef.close(true);
        },
        error: () => this.saving.set(false),
      });
    }
  }
}
