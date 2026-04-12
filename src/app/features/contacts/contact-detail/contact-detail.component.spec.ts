import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NEVER, of, throwError } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/angular';
import { ContactDetailComponent } from './contact-detail.component';
import { ContactService } from '../services/contact.service';
import { NotificationService } from '@core/services/notification.service';
import { renderWithProviders } from '../../../../testing/render';
import { makeContactDetail, makeCompany, makeTag, makeDeal, makeActivity } from '../../../../testing/fixtures';

interface ContactServiceStub {
  getContact: ReturnType<typeof vi.fn>;
  deleteContact: ReturnType<typeof vi.fn>;
}

interface NotificationStub {
  success: ReturnType<typeof vi.fn>;
}

interface DialogStub {
  open: ReturnType<typeof vi.fn>;
}

function makeStubs() {
  const dialogRef = {
    afterClosed: vi.fn().mockReturnValue(of(undefined)),
  } as unknown as MatDialogRef<unknown>;

  const contactService: ContactServiceStub = {
    getContact: vi.fn().mockReturnValue(
      of(
        makeContactDetail({
          id: 7,
          firstName: 'Ada',
          lastName: 'Lovelace',
          notes: 'Cool',
          company: makeCompany(),
          tags: [makeTag()],
          deals: [makeDeal({ id: 1 })],
          activities: [makeActivity({ id: 1 })],
        }),
      ),
    ),
    deleteContact: vi.fn().mockReturnValue(of(undefined)),
  };
  const notification: NotificationStub = { success: vi.fn() };
  const dialog: DialogStub = { open: vi.fn().mockReturnValue(dialogRef) };

  return { contactService, notification, dialog, dialogRef };
}

async function renderDetail(overrides?: { id?: string; dialogResult?: unknown }) {
  const stubs = makeStubs();
  if (overrides?.dialogResult !== undefined) {
    (stubs.dialogRef.afterClosed as ReturnType<typeof vi.fn>).mockReturnValue(of(overrides.dialogResult));
  }
  const id = overrides?.id ?? '7';

  const result = await renderWithProviders(ContactDetailComponent, {
    routes: [{ path: 'contacts', children: [] }],
    providers: [
      { provide: ContactService, useValue: stubs.contactService },
      { provide: NotificationService, useValue: stubs.notification },
      { provide: MatDialog, useValue: stubs.dialog },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: (_: string) => id } } },
      },
    ],
  });

  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  return { ...result, ...stubs, navigate };
}

describe('ContactDetailComponent', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('loads and renders the contact', async () => {
    const { contactService } = await renderDetail();
    expect(contactService.getContact).toHaveBeenCalledWith(7);
    expect(await screen.findByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument();
  });

  it('navigates to /contacts and clears loading when the load fails', async () => {
    const stubs = makeStubs();
    stubs.contactService.getContact.mockImplementation(() => throwError(() => new Error('nope')));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'contacts', children: [] }]),
        provideHttpClient(),
        provideAnimationsAsync('noop'),
        { provide: ContactService, useValue: stubs.contactService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (_: string) => '7' } } },
        },
      ],
    });

    const navigateSpy = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);

    const fixture = TestBed.createComponent(ContactDetailComponent);
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(['/contacts']);
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.contact()).toBeNull();
  });

  it('openEditDialog does nothing when there is no contact', async () => {
    const { fixture, dialog } = await renderDetail();
    fixture.componentInstance.contact.set(null);
    fixture.componentInstance.openEditDialog();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('openEditDialog opens the dialog and reloads when it returns truthy', async () => {
    const { fixture, dialog, contactService } = await renderDetail({ dialogResult: true });
    contactService.getContact.mockClear();

    fixture.componentInstance.openEditDialog();

    expect(dialog.open).toHaveBeenCalled();
    expect(contactService.getContact).toHaveBeenCalledWith(7);
  });

  it('openEditDialog does not reload when dismissed without saving', async () => {
    const { fixture, dialog, contactService } = await renderDetail({ dialogResult: undefined });
    contactService.getContact.mockClear();

    fixture.componentInstance.openEditDialog();

    expect(dialog.open).toHaveBeenCalled();
    expect(contactService.getContact).not.toHaveBeenCalled();
  });

  it('confirmDelete does nothing when there is no contact', async () => {
    const { fixture, dialog } = await renderDetail();
    fixture.componentInstance.contact.set(null);
    fixture.componentInstance.confirmDelete();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('confirmDelete deletes and navigates when confirmed', async () => {
    const { fixture, dialog, contactService, notification, navigate } = await renderDetail({
      dialogResult: true,
    });

    fixture.componentInstance.confirmDelete();

    expect(dialog.open).toHaveBeenCalled();
    expect(contactService.deleteContact).toHaveBeenCalledWith(7);
    expect(notification.success).toHaveBeenCalledWith('Contact deleted');
    expect(navigate).toHaveBeenCalledWith(['/contacts']);
  });

  it('confirmDelete does nothing when cancelled', async () => {
    const { fixture, contactService, notification, navigate } = await renderDetail({
      dialogResult: false,
    });

    fixture.componentInstance.confirmDelete();

    expect(contactService.deleteContact).not.toHaveBeenCalled();
    expect(notification.success).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('clicks the edit button via DOM', async () => {
    const { dialog } = await renderDetail({ dialogResult: false });
    const editBtn = screen.getByRole('button', { name: /Edit/i });
    await userEvent.click(editBtn);
    expect(dialog.open).toHaveBeenCalled();
  });

  it('clicks the delete button via DOM', async () => {
    const { dialog } = await renderDetail({ dialogResult: false });
    const deleteBtn = screen.getByRole('button', { name: /Delete/i });
    await userEvent.click(deleteBtn);
    expect(dialog.open).toHaveBeenCalled();
  });

  it('renders the loading state when contact is null and loading is true', async () => {
    const stubs = makeStubs();
    // Return a never-completing observable so loading stays true and contact stays null.
    stubs.contactService.getContact.mockReturnValue(NEVER);

    await renderWithProviders(ContactDetailComponent, {
      routes: [{ path: 'contacts', children: [] }],
      providers: [
        { provide: ContactService, useValue: stubs.contactService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (_: string) => '7' } } },
        },
      ],
    });

    expect(screen.getByText('Loading contact...')).toBeInTheDocument();
  });

  it('renders fallbacks when email and phone are missing', async () => {
    const stubs = makeStubs();
    stubs.contactService.getContact.mockReturnValue(
      of(
        makeContactDetail({
          id: 9,
          email: null,
          phone: null,
          title: null,
          company: null,
          tags: [],
          notes: null,
          lastContactedAt: null,
          deals: [],
          activities: [],
        }),
      ),
    );

    await renderWithProviders(ContactDetailComponent, {
      routes: [{ path: 'contacts', children: [] }],
      providers: [
        { provide: ContactService, useValue: stubs.contactService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (_: string) => '9' } } },
        },
      ],
    });

    expect(await screen.findByText('No email')).toBeInTheDocument();
    expect(screen.getByText('No phone')).toBeInTheDocument();
  });

  it('renders the empty deals/activities tabs when there are none', async () => {
    const stubs = makeStubs();
    stubs.contactService.getContact.mockReturnValue(
      of(
        makeContactDetail({
          id: 8,
          deals: [],
          activities: [],
          tags: [],
          notes: null,
          lastContactedAt: null,
          company: null,
        }),
      ),
    );

    await renderWithProviders(ContactDetailComponent, {
      routes: [{ path: 'contacts', children: [] }],
      providers: [
        { provide: ContactService, useValue: stubs.contactService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (_: string) => '8' } } },
        },
      ],
    });

    expect(await screen.findByText('No deals yet')).toBeInTheDocument();
  });
});
