import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CompanyService } from '../services/company.service';
import { NotificationService } from '@core/services/notification.service';
import { Company } from '@core/models/company.model';

@Component({
  selector: 'app-company-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './company-form-dialog.component.html',
  styleUrl: './company-form-dialog.component.scss',
})
export class CompanyFormDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CompanyFormDialogComponent>);
  private companyService = inject(CompanyService);
  private notification = inject(NotificationService);
  data = inject<Company | null>(MAT_DIALOG_DATA);

  saving = signal(false);
  isEdit = !!this.data;

  form = this.fb.nonNullable.group({
    name: [this.data?.name ?? '', Validators.required],
    industry: [this.data?.industry ?? ''],
    website: [this.data?.website ?? ''],
    phone: [this.data?.phone ?? ''],
    address: [''],
    city: [this.data?.city ?? ''],
    state: [this.data?.state ?? ''],
    zip: [''],
    notes: [''],
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const value = this.form.getRawValue();

    if (this.isEdit) {
      this.companyService.updateCompany(this.data!.id, value).subscribe({
        next: () => {
          this.notification.success('Company updated');
          this.dialogRef.close(true);
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.companyService.createCompany(value).subscribe({
        next: () => {
          this.notification.success('Company created');
          this.dialogRef.close(true);
        },
        error: () => this.saving.set(false),
      });
    }
  }
}
