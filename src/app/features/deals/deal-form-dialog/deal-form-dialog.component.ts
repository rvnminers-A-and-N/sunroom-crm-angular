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
import { DealService } from '../services/deal.service';
import { ContactService } from '@features/contacts/services/contact.service';
import { CompanyService } from '@features/companies/services/company.service';
import { NotificationService } from '@core/services/notification.service';
import { Deal, DealStage } from '@core/models/deal.model';
import { Contact } from '@core/models/contact.model';
import { Company } from '@core/models/company.model';

@Component({
  selector: 'app-deal-form-dialog',
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
  templateUrl: './deal-form-dialog.component.html',
  styleUrl: './deal-form-dialog.component.scss',
})
export class DealFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<DealFormDialogComponent>);
  private dealService = inject(DealService);
  private contactService = inject(ContactService);
  private companyService = inject(CompanyService);
  private notification = inject(NotificationService);
  data = inject<Deal | null>(MAT_DIALOG_DATA);

  saving = signal(false);
  contacts = signal<Contact[]>([]);
  companies = signal<Company[]>([]);
  isEdit = !!this.data;
  stages: DealStage[] = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

  form = this.fb.nonNullable.group({
    title: [this.data?.title ?? '', Validators.required],
    value: [this.data?.value ?? 0, [Validators.required, Validators.min(0)]],
    contactId: [this.data?.contactId ?? 0, Validators.required],
    companyId: [this.data?.companyId as number | null],
    stage: [this.data?.stage ?? 'Lead'],
    expectedCloseDate: [this.data?.expectedCloseDate ? new Date(this.data.expectedCloseDate) : null as Date | null],
    notes: [''],
  });

  ngOnInit(): void {
    this.contactService
      .getContacts({ page: 1, perPage: 200 })
      .subscribe((res) => this.contacts.set(res.data));
    this.companyService
      .getCompanies(1, 200)
      .subscribe((res) => this.companies.set(res.data));
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const raw = this.form.getRawValue();
    const value = {
      ...raw,
      companyId: raw.companyId || undefined,
      expectedCloseDate: raw.expectedCloseDate
        ? raw.expectedCloseDate.toISOString()
        : undefined,
    };

    if (this.isEdit) {
      this.dealService.updateDeal(this.data!.id, value).subscribe({
        next: () => {
          this.notification.success('Deal updated');
          this.dialogRef.close(true);
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.dealService.createDeal(value).subscribe({
        next: () => {
          this.notification.success('Deal created');
          this.dialogRef.close(true);
        },
        error: () => this.saving.set(false),
      });
    }
  }
}
