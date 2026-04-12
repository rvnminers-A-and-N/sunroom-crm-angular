import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NEVER, of, throwError } from 'rxjs';
import { screen } from '@testing-library/angular';
import { ActivityFormDialogComponent } from './activity-form-dialog.component';
import { ActivityService } from '../services/activity.service';
import { ContactService } from '@features/contacts/services/contact.service';
import { DealService } from '@features/deals/services/deal.service';
import { NotificationService } from '@core/services/notification.service';
import { renderWithProviders } from '../../../../testing/render';
import {
  makeActivity,
  makeContact,
  makeDeal,
  makePaginated,
} from '../../../../testing/fixtures';
import type { Activity } from '@core/models/activity.model';

interface ActivityServiceStub {
  createActivity: ReturnType<typeof vi.fn>;
  updateActivity: ReturnType<typeof vi.fn>;
}

interface ContactServiceStub {
  getContacts: ReturnType<typeof vi.fn>;
}

interface DealServiceStub {
  getDeals: ReturnType<typeof vi.fn>;
}

interface NotificationStub {
  success: ReturnType<typeof vi.fn>;
}

function makeStubs() {
  const activityService: ActivityServiceStub = {
    createActivity: vi.fn().mockReturnValue(of(makeActivity({ id: 99 }))),
    updateActivity: vi.fn().mockReturnValue(of(makeActivity({ id: 5 }))),
  };
  const contactService: ContactServiceStub = {
    getContacts: vi
      .fn()
      .mockReturnValue(of(makePaginated([makeContact({ id: 1 }), makeContact({ id: 2, firstName: 'Grace', lastName: 'Hopper' })]))),
  };
  const dealService: DealServiceStub = {
    getDeals: vi
      .fn()
      .mockReturnValue(of(makePaginated([makeDeal({ id: 1 }), makeDeal({ id: 2, title: 'Other Deal' })]))),
  };
  const notification: NotificationStub = { success: vi.fn() };
  const dialogRef = { close: vi.fn() } as unknown as MatDialogRef<ActivityFormDialogComponent>;

  return { activityService, contactService, dealService, notification, dialogRef };
}

async function renderDialog(data: Activity | null) {
  const stubs = makeStubs();
  const result = await renderWithProviders(ActivityFormDialogComponent, {
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: stubs.dialogRef },
      { provide: ActivityService, useValue: stubs.activityService },
      { provide: ContactService, useValue: stubs.contactService },
      { provide: DealService, useValue: stubs.dealService },
      { provide: NotificationService, useValue: stubs.notification },
    ],
  });
  return { ...result, ...stubs };
}

describe('ActivityFormDialogComponent', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('renders the create-mode title and seeds an empty form', async () => {
    const { fixture } = await renderDialog(null);
    expect(screen.getByText('Log Activity')).toBeInTheDocument();
    expect(fixture.componentInstance.isEdit).toBe(false);
    expect(fixture.componentInstance.form.value.subject).toBe('');
    expect(fixture.componentInstance.form.value.type).toBe('Note');
  });

  it('renders the edit-mode title and seeds the form from the data', async () => {
    const data = makeActivity({
      id: 5,
      type: 'Call',
      subject: 'Quarterly review',
      body: 'Discussed Q1 numbers',
      contactId: 2,
      dealId: 2,
      occurredAt: '2025-06-01T12:00:00.000Z',
    });
    const { fixture } = await renderDialog(data);
    expect(screen.getByText('Edit Activity')).toBeInTheDocument();
    expect(fixture.componentInstance.isEdit).toBe(true);
    const value = fixture.componentInstance.form.getRawValue();
    expect(value.type).toBe('Call');
    expect(value.subject).toBe('Quarterly review');
    expect(value.body).toBe('Discussed Q1 numbers');
    expect(value.contactId).toBe(2);
    expect(value.dealId).toBe(2);
    expect(value.occurredAt).toEqual(new Date('2025-06-01T12:00:00.000Z'));
  });

  it('loads contacts and deals on init', async () => {
    const { fixture, contactService, dealService } = await renderDialog(null);
    expect(contactService.getContacts).toHaveBeenCalledWith({ page: 1, perPage: 200 });
    expect(dealService.getDeals).toHaveBeenCalledWith({ page: 1, perPage: 200 });
    expect(fixture.componentInstance.contacts()).toHaveLength(2);
    expect(fixture.componentInstance.deals()).toHaveLength(2);
  });

  it('does not submit when the form is invalid', async () => {
    const { fixture, activityService } = await renderDialog(null);
    // The default subject is empty so the form is invalid.
    fixture.componentInstance.onSubmit();
    expect(activityService.createActivity).not.toHaveBeenCalled();
    expect(fixture.componentInstance.saving()).toBe(false);
  });

  it('creates an activity and closes on success', async () => {
    const { fixture, activityService, notification, dialogRef } = await renderDialog(null);
    fixture.componentInstance.form.patchValue({
      subject: 'New note',
      contactId: 1,
      dealId: 1,
    });

    fixture.componentInstance.onSubmit();

    expect(activityService.createActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'Note',
        subject: 'New note',
        contactId: 1,
        dealId: 1,
        occurredAt: expect.any(String),
      }),
    );
    expect(notification.success).toHaveBeenCalledWith('Activity created');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('creates with contactId and dealId undefined when none are selected', async () => {
    const { fixture, activityService } = await renderDialog(null);
    fixture.componentInstance.form.patchValue({
      subject: 'Solo note',
      contactId: null,
      dealId: null,
    });

    fixture.componentInstance.onSubmit();

    expect(activityService.createActivity).toHaveBeenCalledWith(
      expect.objectContaining({ contactId: undefined, dealId: undefined }),
    );
  });

  it('creates with occurredAt undefined when the date is cleared', async () => {
    const { fixture, activityService } = await renderDialog(null);
    fixture.componentInstance.form.patchValue({
      subject: 'No date',
      occurredAt: null as unknown as Date,
    });

    fixture.componentInstance.onSubmit();

    expect(activityService.createActivity).toHaveBeenCalledWith(
      expect.objectContaining({ occurredAt: undefined }),
    );
  });

  it('clears saving on create error', async () => {
    const { fixture, activityService } = await renderDialog(null);
    activityService.createActivity.mockReturnValueOnce(throwError(() => new Error('nope')));

    fixture.componentInstance.form.patchValue({ subject: 'Will fail' });
    fixture.componentInstance.onSubmit();

    expect(fixture.componentInstance.saving()).toBe(false);
  });

  it('updates an activity and closes on success', async () => {
    const data = makeActivity({ id: 5 });
    const { fixture, activityService, notification, dialogRef } = await renderDialog(data);

    fixture.componentInstance.form.patchValue({
      subject: 'Updated subject',
    });
    fixture.componentInstance.onSubmit();

    expect(activityService.updateActivity).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        subject: 'Updated subject',
        type: 'Note',
      }),
    );
    expect(notification.success).toHaveBeenCalledWith('Activity updated');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('clears saving on update error', async () => {
    const data = makeActivity({ id: 5 });
    const { fixture, activityService } = await renderDialog(data);
    activityService.updateActivity.mockReturnValueOnce(throwError(() => new Error('nope')));

    fixture.componentInstance.form.patchValue({ subject: 'Updated' });
    fixture.componentInstance.onSubmit();

    expect(fixture.componentInstance.saving()).toBe(false);
  });

  it('shows the required mat-error when subject is cleared', async () => {
    const { fixture } = await renderDialog(null);
    fixture.componentInstance.form.controls.subject.setValue('');
    fixture.componentInstance.form.controls.subject.markAsTouched();
    fixture.detectChanges();

    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('renders the saving spinner while submission is in flight', async () => {
    const { fixture, activityService } = await renderDialog(null);
    activityService.createActivity.mockReturnValueOnce(NEVER);

    fixture.componentInstance.form.patchValue({ subject: 'Wait' });
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(fixture.componentInstance.saving()).toBe(true);
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
  });

  it('submits the form when the form element receives a submit event', async () => {
    const { fixture, activityService } = await renderDialog(null);
    fixture.componentInstance.form.patchValue({ subject: 'Submit me' });
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form#activityForm') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(activityService.createActivity).toHaveBeenCalled();
  });
});
