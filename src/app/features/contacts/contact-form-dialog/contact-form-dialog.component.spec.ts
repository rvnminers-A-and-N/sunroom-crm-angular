import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NEVER, of, throwError } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/angular';
import { ContactFormDialogComponent } from './contact-form-dialog.component';
import { ContactService } from '../services/contact.service';
import { TagService } from '@core/services/tag.service';
import { NotificationService } from '@core/services/notification.service';
import { ApiService } from '@core/services/api.service';
import { renderWithProviders } from '../../../../testing/render';
import { makeContact, makeTag, makeCompany, makePaginated } from '../../../../testing/fixtures';
import type { Contact } from '@core/models/contact.model';

interface ContactServiceStub {
  createContact: ReturnType<typeof vi.fn>;
  updateContact: ReturnType<typeof vi.fn>;
}

interface TagServiceStub {
  getTags: ReturnType<typeof vi.fn>;
}

interface ApiServiceStub {
  get: ReturnType<typeof vi.fn>;
}

interface NotificationStub {
  success: ReturnType<typeof vi.fn>;
}

function makeStubs() {
  const contactService: ContactServiceStub = {
    createContact: vi.fn().mockReturnValue(of(makeContact({ id: 99 }))),
    updateContact: vi.fn().mockReturnValue(of(makeContact({ id: 5 }))),
  };
  const tagService: TagServiceStub = {
    getTags: vi.fn().mockReturnValue(of([makeTag({ id: 1 }), makeTag({ id: 2, name: 'Lead' })])),
  };
  const apiService: ApiServiceStub = {
    get: vi.fn().mockReturnValue(of(makePaginated([makeCompany({ id: 1 }), makeCompany({ id: 2, name: 'Other Co' })]))),
  };
  const notification: NotificationStub = { success: vi.fn() };
  const dialogRef = { close: vi.fn() } as unknown as MatDialogRef<ContactFormDialogComponent>;

  return { contactService, tagService, apiService, notification, dialogRef };
}

async function renderDialog(data: Contact | null) {
  const stubs = makeStubs();
  const result = await renderWithProviders(ContactFormDialogComponent, {
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: stubs.dialogRef },
      { provide: ContactService, useValue: stubs.contactService },
      { provide: TagService, useValue: stubs.tagService },
      { provide: ApiService, useValue: stubs.apiService },
      { provide: NotificationService, useValue: stubs.notification },
    ],
  });
  return { ...result, ...stubs };
}

describe('ContactFormDialogComponent', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('renders the create-mode title and seeds an empty form', async () => {
    const { fixture } = await renderDialog(null);
    expect(screen.getByText('New Contact')).toBeInTheDocument();
    expect(fixture.componentInstance.isEdit).toBe(false);
    expect(fixture.componentInstance.form.value.firstName).toBe('');
  });

  it('renders the edit-mode title and seeds the form from the data', async () => {
    const data = makeContact({
      id: 5,
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.com',
      phone: '555-9999',
      title: 'Admiral',
      companyId: 2,
      tags: [makeTag({ id: 1 }), makeTag({ id: 2 })],
    });
    const { fixture } = await renderDialog(data);
    expect(screen.getByText('Edit Contact')).toBeInTheDocument();
    expect(fixture.componentInstance.isEdit).toBe(true);
    const value = fixture.componentInstance.form.getRawValue();
    expect(value.firstName).toBe('Grace');
    expect(value.lastName).toBe('Hopper');
    expect(value.email).toBe('grace@example.com');
    expect(value.phone).toBe('555-9999');
    expect(value.title).toBe('Admiral');
    expect(value.companyId).toBe(2);
    expect(value.tagIds).toEqual([1, 2]);
  });

  it('loads tags and companies on init', async () => {
    const { fixture, tagService, apiService } = await renderDialog(null);
    expect(tagService.getTags).toHaveBeenCalled();
    expect(apiService.get).toHaveBeenCalledWith('/companies?perPage=100');
    expect(fixture.componentInstance.tags()).toHaveLength(2);
    expect(fixture.componentInstance.companies()).toHaveLength(2);
  });

  it('does not submit when the form is invalid', async () => {
    const { fixture, contactService } = await renderDialog(null);
    fixture.componentInstance.onSubmit();
    expect(contactService.createContact).not.toHaveBeenCalled();
    expect(fixture.componentInstance.saving()).toBe(false);
  });

  it('creates a contact and closes on success', async () => {
    const { fixture, contactService, notification, dialogRef } = await renderDialog(null);
    fixture.componentInstance.form.patchValue({
      firstName: 'Linus',
      lastName: 'Torvalds',
      email: 'linus@example.com',
      tagIds: [1],
    });

    fixture.componentInstance.onSubmit();

    expect(contactService.createContact).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Linus',
        lastName: 'Torvalds',
        email: 'linus@example.com',
        companyId: undefined,
        tagIds: [1],
      }),
    );
    expect(notification.success).toHaveBeenCalledWith('Contact created');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('creates without tagIds when none are selected', async () => {
    const { fixture, contactService } = await renderDialog(null);
    fixture.componentInstance.form.patchValue({
      firstName: 'Linus',
      lastName: 'Torvalds',
      tagIds: [],
    });

    fixture.componentInstance.onSubmit();

    expect(contactService.createContact).toHaveBeenCalledWith(
      expect.objectContaining({ tagIds: undefined }),
    );
  });

  it('clears saving on create error', async () => {
    const { fixture, contactService } = await renderDialog(null);
    contactService.createContact.mockReturnValueOnce(throwError(() => new Error('nope')));

    fixture.componentInstance.form.patchValue({
      firstName: 'Linus',
      lastName: 'Torvalds',
    });
    fixture.componentInstance.onSubmit();

    expect(fixture.componentInstance.saving()).toBe(false);
  });

  it('updates a contact and closes on success', async () => {
    const data = makeContact({ id: 5, companyId: 2 });
    const { fixture, contactService, notification, dialogRef } = await renderDialog(data);

    fixture.componentInstance.form.patchValue({
      firstName: 'Updated',
      lastName: 'Name',
    });
    fixture.componentInstance.onSubmit();

    expect(contactService.updateContact).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        firstName: 'Updated',
        lastName: 'Name',
        companyId: 2,
      }),
    );
    // ensure the tagIds key was stripped before sending the update
    const callArg = contactService.updateContact.mock.calls[0][1];
    expect(callArg).not.toHaveProperty('tagIds');
    expect(notification.success).toHaveBeenCalledWith('Contact updated');
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('updates with companyId undefined when none selected', async () => {
    const data = makeContact({ id: 7, companyId: null });
    const { fixture, contactService } = await renderDialog(data);

    fixture.componentInstance.form.patchValue({ firstName: 'Ada', lastName: 'L' });
    fixture.componentInstance.onSubmit();

    expect(contactService.updateContact).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ companyId: undefined }),
    );
  });

  it('clears saving on update error', async () => {
    const data = makeContact({ id: 5 });
    const { fixture, contactService } = await renderDialog(data);
    contactService.updateContact.mockReturnValueOnce(throwError(() => new Error('nope')));

    fixture.componentInstance.form.patchValue({ firstName: 'X', lastName: 'Y' });
    fixture.componentInstance.onSubmit();

    expect(fixture.componentInstance.saving()).toBe(false);
  });

  it('hides the tags field in edit mode', async () => {
    await renderDialog(makeContact({ id: 5 }));
    expect(screen.queryByText('Tags')).not.toBeInTheDocument();
  });

  it('shows the tags field in create mode', async () => {
    await renderDialog(null);
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  it('renders the saving spinner while submission is in flight', async () => {
    const { fixture, contactService } = await renderDialog(null);
    // Use a never-completing observable so saving stays true
    contactService.createContact.mockReturnValueOnce(NEVER);

    fixture.componentInstance.form.patchValue({ firstName: 'Wait', lastName: 'ing' });
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();

    expect(fixture.componentInstance.saving()).toBe(true);
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
  });

  it('submits the form when the form element receives a submit event', async () => {
    const { fixture, contactService } = await renderDialog(null);
    fixture.componentInstance.form.patchValue({ firstName: 'Sub', lastName: 'Mit' });
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form#contactForm') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(contactService.createContact).toHaveBeenCalled();
  });
});
