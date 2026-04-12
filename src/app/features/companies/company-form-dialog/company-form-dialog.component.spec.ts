import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NEVER, of, throwError } from 'rxjs';
import { screen } from '@testing-library/angular';
import { CompanyFormDialogComponent } from './company-form-dialog.component';
import { CompanyService } from '../services/company.service';
import { NotificationService } from '@core/services/notification.service';
import { renderWithProviders } from '../../../../testing/render';
import { makeCompany } from '../../../../testing/fixtures';
import type { Company } from '@core/models/company.model';

interface CompanyServiceStub {
  createCompany: ReturnType<typeof vi.fn>;
  updateCompany: ReturnType<typeof vi.fn>;
}

interface NotificationStub {
  success: ReturnType<typeof vi.fn>;
}

function makeStubs() {
  const companyService: CompanyServiceStub = {
    createCompany: vi.fn().mockReturnValue(of(makeCompany({ id: 99 }))),
    updateCompany: vi.fn().mockReturnValue(of(makeCompany({ id: 5 }))),
  };
  const notification: NotificationStub = { success: vi.fn() };
  const dialogRef = { close: vi.fn() } as unknown as MatDialogRef<CompanyFormDialogComponent>;

  return { companyService, notification, dialogRef };
}

async function renderDialog(data: Company | null) {
  const stubs = makeStubs();
  const result = await renderWithProviders(CompanyFormDialogComponent, {
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: stubs.dialogRef },
      { provide: CompanyService, useValue: stubs.companyService },
      { provide: NotificationService, useValue: stubs.notification },
    ],
  });
  return { ...result, ...stubs };
}

describe('CompanyFormDialogComponent', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('renders the create-mode title and seeds an empty form', async () => {
    const { fixture } = await renderDialog(null);
    expect(screen.getByText('New Company')).toBeInTheDocument();
    expect(fixture.componentInstance.isEdit).toBe(false);
    expect(fixture.componentInstance.form.value.name).toBe('');
  });

  it('renders the edit-mode title and seeds the form from the data', async () => {
    const data = makeCompany({
      id: 5,
      name: 'Acme Inc',
      industry: 'Tech',
      website: 'https://acme.example',
      phone: '555-0200',
      city: 'Springfield',
      state: 'IL',
    });
    const { fixture } = await renderDialog(data);
    expect(screen.getByText('Edit Company')).toBeInTheDocument();
    expect(fixture.componentInstance.isEdit).toBe(true);
    const value = fixture.componentInstance.form.getRawValue();
    expect(value.name).toBe('Acme Inc');
    expect(value.industry).toBe('Tech');
    expect(value.website).toBe('https://acme.example');
    expect(value.phone).toBe('555-0200');
    expect(value.city).toBe('Springfield');
    expect(value.state).toBe('IL');
  });

  it('does not submit when the form is invalid', async () => {
    const { fixture, companyService } = await renderDialog(null);
    fixture.componentInstance.onSubmit();
    expect(companyService.createCompany).not.toHaveBeenCalled();
    expect(fixture.componentInstance.saving()).toBe(false);
  });

  it('creates a company and closes on success', async () => {
    const { fixture, companyService, notification, dialogRef } = await renderDialog(null);
    fixture.componentInstance.form.patchValue({
      name: 'New Acme',
      industry: 'Tech',
      website: 'https://new.example',
    });

    fixture.componentInstance.onSubmit();

    expect(companyService.createCompany).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Acme',
        industry: 'Tech',
        website: 'https://new.example',
      }),
    );
    expect(notification.success).toHaveBeenCalledWith('Company created');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('clears saving on create error', async () => {
    const { fixture, companyService } = await renderDialog(null);
    companyService.createCompany.mockReturnValueOnce(throwError(() => new Error('nope')));

    fixture.componentInstance.form.patchValue({ name: 'X' });
    fixture.componentInstance.onSubmit();

    expect(fixture.componentInstance.saving()).toBe(false);
  });

  it('updates a company and closes on success', async () => {
    const data = makeCompany({ id: 5 });
    const { fixture, companyService, notification, dialogRef } = await renderDialog(data);

    fixture.componentInstance.form.patchValue({
      name: 'Renamed',
      industry: 'Updated',
    });
    fixture.componentInstance.onSubmit();

    expect(companyService.updateCompany).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        name: 'Renamed',
        industry: 'Updated',
      }),
    );
    expect(notification.success).toHaveBeenCalledWith('Company updated');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('clears saving on update error', async () => {
    const data = makeCompany({ id: 5 });
    const { fixture, companyService } = await renderDialog(data);
    companyService.updateCompany.mockReturnValueOnce(throwError(() => new Error('nope')));

    fixture.componentInstance.form.patchValue({ name: 'Y' });
    fixture.componentInstance.onSubmit();

    expect(fixture.componentInstance.saving()).toBe(false);
  });

  it('shows the required error when name is empty', async () => {
    const { fixture } = await renderDialog(null);
    fixture.componentInstance.form.controls.name.markAsTouched();
    fixture.detectChanges();
    expect(fixture.componentInstance.form.controls.name.hasError('required')).toBe(true);
  });

  it('renders the saving spinner while submission is in flight', async () => {
    const { fixture, companyService } = await renderDialog(null);
    // Use a never-completing observable so saving stays true
    companyService.createCompany.mockReturnValueOnce(NEVER);

    fixture.componentInstance.form.patchValue({ name: 'Wait' });
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(fixture.componentInstance.saving()).toBe(true);
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
  });

  it('submits the form when the form element receives a submit event', async () => {
    const { fixture, companyService } = await renderDialog(null);
    fixture.componentInstance.form.patchValue({ name: 'Submit Me' });
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form#companyForm') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(companyService.createCompany).toHaveBeenCalled();
  });
});
