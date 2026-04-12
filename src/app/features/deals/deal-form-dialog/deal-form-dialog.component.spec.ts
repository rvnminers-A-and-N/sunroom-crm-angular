import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NEVER, of, throwError } from 'rxjs';
import { screen } from '@testing-library/angular';
import { DealFormDialogComponent } from './deal-form-dialog.component';
import { DealService } from '../services/deal.service';
import { ContactService } from '@features/contacts/services/contact.service';
import { CompanyService } from '@features/companies/services/company.service';
import { NotificationService } from '@core/services/notification.service';
import { renderWithProviders } from '../../../../testing/render';
import { makeDeal, makeContact, makeCompany, makePaginated } from '../../../../testing/fixtures';
import type { Deal } from '@core/models/deal.model';

interface DealServiceStub {
  createDeal: ReturnType<typeof vi.fn>;
  updateDeal: ReturnType<typeof vi.fn>;
}

interface ContactServiceStub {
  getContacts: ReturnType<typeof vi.fn>;
}

interface CompanyServiceStub {
  getCompanies: ReturnType<typeof vi.fn>;
}

interface NotificationStub {
  success: ReturnType<typeof vi.fn>;
}

function makeStubs() {
  const dealService: DealServiceStub = {
    createDeal: vi.fn().mockReturnValue(of(makeDeal({ id: 99 }))),
    updateDeal: vi.fn().mockReturnValue(of(makeDeal({ id: 5 }))),
  };
  const contactService: ContactServiceStub = {
    getContacts: vi.fn().mockReturnValue(of(makePaginated([makeContact({ id: 1 })]))),
  };
  const companyService: CompanyServiceStub = {
    getCompanies: vi.fn().mockReturnValue(of(makePaginated([makeCompany({ id: 1 })]))),
  };
  const notification: NotificationStub = { success: vi.fn() };
  const dialogRef = { close: vi.fn() } as unknown as MatDialogRef<DealFormDialogComponent>;

  return { dealService, contactService, companyService, notification, dialogRef };
}

async function renderDialog(data: Deal | null) {
  const stubs = makeStubs();
  const result = await renderWithProviders(DealFormDialogComponent, {
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: stubs.dialogRef },
      { provide: DealService, useValue: stubs.dealService },
      { provide: ContactService, useValue: stubs.contactService },
      { provide: CompanyService, useValue: stubs.companyService },
      { provide: NotificationService, useValue: stubs.notification },
    ],
  });
  return { ...result, ...stubs };
}

describe('DealFormDialogComponent', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('renders the create-mode title and seeds an empty form', async () => {
    const { fixture } = await renderDialog(null);
    expect(screen.getByText('New Deal')).toBeInTheDocument();
    expect(fixture.componentInstance.isEdit).toBe(false);
    expect(fixture.componentInstance.form.value.title).toBe('');
    expect(fixture.componentInstance.form.value.value).toBe(0);
    expect(fixture.componentInstance.form.value.stage).toBe('Lead');
  });

  it('renders the edit-mode title and seeds the form from the data', async () => {
    const data = makeDeal({
      id: 5,
      title: 'Big Deal',
      value: 25_000,
      contactId: 7,
      companyId: 9,
      stage: 'Qualified',
      expectedCloseDate: '2025-12-31T00:00:00.000Z',
    });
    const { fixture } = await renderDialog(data);
    expect(screen.getByText('Edit Deal')).toBeInTheDocument();
    expect(fixture.componentInstance.isEdit).toBe(true);
    const value = fixture.componentInstance.form.getRawValue();
    expect(value.title).toBe('Big Deal');
    expect(value.value).toBe(25_000);
    expect(value.contactId).toBe(7);
    expect(value.companyId).toBe(9);
    expect(value.stage).toBe('Qualified');
    expect(value.expectedCloseDate).toBeInstanceOf(Date);
  });

  it('loads contacts and companies on init', async () => {
    const { fixture, contactService, companyService } = await renderDialog(null);
    expect(contactService.getContacts).toHaveBeenCalledWith({ page: 1, perPage: 200 });
    expect(companyService.getCompanies).toHaveBeenCalledWith(1, 200);
    expect(fixture.componentInstance.contacts()).toHaveLength(1);
    expect(fixture.componentInstance.companies()).toHaveLength(1);
  });

  it('does not submit when the form is invalid', async () => {
    const { fixture, dealService } = await renderDialog(null);
    fixture.componentInstance.onSubmit();
    expect(dealService.createDeal).not.toHaveBeenCalled();
    expect(fixture.componentInstance.saving()).toBe(false);
  });

  it('creates a deal and closes on success', async () => {
    const { fixture, dealService, notification, dialogRef } = await renderDialog(null);
    fixture.componentInstance.form.patchValue({
      title: 'New Deal',
      value: 5_000,
      contactId: 1,
      companyId: 1,
      stage: 'Lead',
    });

    fixture.componentInstance.onSubmit();

    expect(dealService.createDeal).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New Deal',
        value: 5_000,
        contactId: 1,
        companyId: 1,
        stage: 'Lead',
        expectedCloseDate: undefined,
      }),
    );
    expect(notification.success).toHaveBeenCalledWith('Deal created');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('serializes the expected close date as an ISO string', async () => {
    const { fixture, dealService } = await renderDialog(null);
    const date = new Date('2025-12-31T00:00:00.000Z');
    fixture.componentInstance.form.patchValue({
      title: 'Date Deal',
      value: 1,
      contactId: 1,
      expectedCloseDate: date,
    });

    fixture.componentInstance.onSubmit();

    expect(dealService.createDeal).toHaveBeenCalledWith(
      expect.objectContaining({ expectedCloseDate: date.toISOString() }),
    );
  });

  it('omits companyId when none is selected', async () => {
    const { fixture, dealService } = await renderDialog(null);
    fixture.componentInstance.form.patchValue({
      title: 'No Company',
      value: 1,
      contactId: 1,
      companyId: null,
    });

    fixture.componentInstance.onSubmit();

    expect(dealService.createDeal).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: undefined }),
    );
  });

  it('clears saving on create error', async () => {
    const { fixture, dealService } = await renderDialog(null);
    dealService.createDeal.mockReturnValueOnce(throwError(() => new Error('nope')));

    fixture.componentInstance.form.patchValue({
      title: 'X',
      value: 1,
      contactId: 1,
    });
    fixture.componentInstance.onSubmit();

    expect(fixture.componentInstance.saving()).toBe(false);
  });

  it('updates a deal and closes on success', async () => {
    const data = makeDeal({ id: 5, contactId: 1 });
    const { fixture, dealService, notification, dialogRef } = await renderDialog(data);

    fixture.componentInstance.form.patchValue({
      title: 'Renamed',
      value: 200,
      contactId: 1,
    });
    fixture.componentInstance.onSubmit();

    expect(dealService.updateDeal).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        title: 'Renamed',
        value: 200,
      }),
    );
    expect(notification.success).toHaveBeenCalledWith('Deal updated');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('clears saving on update error', async () => {
    const data = makeDeal({ id: 5, contactId: 1 });
    const { fixture, dealService } = await renderDialog(data);
    dealService.updateDeal.mockReturnValueOnce(throwError(() => new Error('nope')));

    fixture.componentInstance.form.patchValue({ title: 'Y', value: 1, contactId: 1 });
    fixture.componentInstance.onSubmit();

    expect(fixture.componentInstance.saving()).toBe(false);
  });

  it('renders the saving spinner while submission is in flight', async () => {
    const { fixture, dealService } = await renderDialog(null);
    dealService.createDeal.mockReturnValueOnce(NEVER);

    fixture.componentInstance.form.patchValue({
      title: 'Wait',
      value: 1,
      contactId: 1,
    });
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(fixture.componentInstance.saving()).toBe(true);
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
  });

  it('shows the required mat-error for the value field when it is blank', async () => {
    const { fixture } = await renderDialog(null);
    fixture.componentInstance.form.controls.value.setValue(null as unknown as number);
    fixture.componentInstance.form.controls.value.markAsTouched();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.value.hasError('required')).toBe(true);
  });

  it('shows the required mat-error for the contact field when it is blank', async () => {
    const { fixture } = await renderDialog(null);
    fixture.componentInstance.form.controls.contactId.setValue(null as unknown as number);
    fixture.componentInstance.form.controls.contactId.markAsTouched();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.contactId.hasError('required')).toBe(true);
  });

  it('submits the form when the form element receives a submit event', async () => {
    const { fixture, dealService } = await renderDialog(null);
    fixture.componentInstance.form.patchValue({
      title: 'Submit Me',
      value: 1,
      contactId: 1,
    });
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form#dealForm') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(dealService.createDeal).toHaveBeenCalled();
  });
});
