import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { screen, fireEvent } from '@testing-library/angular';
import { ContactListComponent } from './contact-list.component';
import { ContactService } from '../services/contact.service';
import { TagService } from '@core/services/tag.service';
import { NotificationService } from '@core/services/notification.service';
import { renderWithProviders } from '../../../../testing/render';
import { makeContact, makeTag, makePaginated } from '../../../../testing/fixtures';

interface ContactServiceStub {
  getContacts: ReturnType<typeof vi.fn>;
  deleteContact: ReturnType<typeof vi.fn>;
}

interface TagServiceStub {
  getTags: ReturnType<typeof vi.fn>;
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
    getContacts: vi.fn().mockReturnValue(
      of(makePaginated([makeContact({ id: 1 }), makeContact({ id: 2, firstName: 'Grace', lastName: 'Hopper' })])),
    ),
    deleteContact: vi.fn().mockReturnValue(of(undefined)),
  };
  const tagService: TagServiceStub = {
    getTags: vi.fn().mockReturnValue(of([makeTag({ id: 1 }), makeTag({ id: 2, name: 'Lead' })])),
  };
  const notification: NotificationStub = { success: vi.fn() };
  const dialog: DialogStub = { open: vi.fn().mockReturnValue(dialogRef) };

  return { contactService, tagService, notification, dialog, dialogRef };
}

async function renderList(overrides?: { dialogResult?: unknown }) {
  const stubs = makeStubs();
  if (overrides?.dialogResult !== undefined) {
    (stubs.dialogRef.afterClosed as ReturnType<typeof vi.fn>).mockReturnValue(of(overrides.dialogResult));
  }

  const result = await renderWithProviders(ContactListComponent, {
    providers: [
      { provide: ContactService, useValue: stubs.contactService },
      { provide: TagService, useValue: stubs.tagService },
      { provide: NotificationService, useValue: stubs.notification },
      { provide: MatDialog, useValue: stubs.dialog },
    ],
  });

  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  return { ...result, ...stubs, navigate };
}

describe('ContactListComponent', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('renders contacts loaded on init', async () => {
    await renderList();
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
  });

  it('shows the empty state when there are no contacts and loading is finished', async () => {
    const stubs = makeStubs();
    stubs.contactService.getContacts.mockReturnValue(of(makePaginated([])));

    await renderWithProviders(ContactListComponent, {
      providers: [
        { provide: ContactService, useValue: stubs.contactService },
        { provide: TagService, useValue: stubs.tagService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    expect(await screen.findByText('No contacts yet')).toBeInTheDocument();
  });

  it('debounces search input then reloads with the new term', async () => {
    vi.useFakeTimers();
    const { fixture, contactService } = await renderList();
    contactService.getContacts.mockClear();

    const component = fixture.componentInstance;
    component.onSearch('ada');
    component.onSearch('adam');

    vi.advanceTimersByTime(350);
    await fixture.whenStable();

    expect(contactService.getContacts).toHaveBeenCalledTimes(1);
    expect(contactService.getContacts).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'adam', page: 1 }),
    );
    vi.useRealTimers();
  });

  it('reloads with selected tag when filter changes and resets to page 1', async () => {
    const { fixture, contactService } = await renderList();
    contactService.getContacts.mockClear();

    const component = fixture.componentInstance;
    component.meta.set({ currentPage: 5, perPage: 10, total: 100, lastPage: 10 });
    component.onTagFilter(2);

    expect(component.selectedTagId).toBe(2);
    expect(component.meta().currentPage).toBe(1);
    expect(contactService.getContacts).toHaveBeenLastCalledWith(
      expect.objectContaining({ tagId: 2, page: 1 }),
    );
  });

  it('handles getContacts error by clearing loading', async () => {
    const stubs = makeStubs();
    stubs.contactService.getContacts.mockReturnValueOnce(throwError(() => new Error('boom')));

    const { fixture } = await renderWithProviders(ContactListComponent, {
      providers: [
        { provide: ContactService, useValue: stubs.contactService },
        { provide: TagService, useValue: stubs.tagService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('reloads on pagination event with new page index and size', async () => {
    const { fixture, contactService } = await renderList();
    contactService.getContacts.mockClear();

    fixture.componentInstance.onPage({ pageIndex: 3, pageSize: 25, length: 100 });

    expect(contactService.getContacts).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 4, perPage: 25 }),
    );
  });

  it('navigates to the contact detail when a row is clicked', async () => {
    const { navigate } = await renderList();
    const rows = await screen.findAllByRole('row');
    // first row is the header; click the first data row
    await userEvent.click(rows[1]);
    expect(navigate).toHaveBeenCalledWith(['/contacts', 1]);
  });

  it('opens the create dialog and reloads when it returns a truthy result', async () => {
    const { dialog, contactService } = await renderList({ dialogResult: true });
    contactService.getContacts.mockClear();

    const addBtn = screen.getByRole('button', { name: /Add Contact/i });
    await userEvent.click(addBtn);

    expect(dialog.open).toHaveBeenCalled();
    expect(contactService.getContacts).toHaveBeenCalledTimes(1);
  });

  it('does not reload after create dialog is dismissed without saving', async () => {
    const { dialog, contactService } = await renderList({ dialogResult: false });
    contactService.getContacts.mockClear();

    const addBtn = screen.getByRole('button', { name: /Add Contact/i });
    await userEvent.click(addBtn);

    expect(dialog.open).toHaveBeenCalled();
    expect(contactService.getContacts).not.toHaveBeenCalled();
  });

  it('opens the empty-state add button when there are no contacts', async () => {
    const stubs = makeStubs();
    stubs.contactService.getContacts.mockReturnValue(of(makePaginated([])));
    (stubs.dialogRef.afterClosed as ReturnType<typeof vi.fn>).mockReturnValue(of(true));

    await renderWithProviders(ContactListComponent, {
      providers: [
        { provide: ContactService, useValue: stubs.contactService },
        { provide: TagService, useValue: stubs.tagService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    const buttons = await screen.findAllByRole('button', { name: /Add Contact/i });
    await userEvent.click(buttons[buttons.length - 1]);
    expect(stubs.dialog.open).toHaveBeenCalled();
  });

  it('opens the edit dialog and stops row click propagation', async () => {
    const { fixture, dialog, contactService } = await renderList({ dialogResult: true });
    contactService.getContacts.mockClear();

    const event = new MouseEvent('click', { bubbles: true });
    const stopSpy = vi.spyOn(event, 'stopPropagation');

    fixture.componentInstance.openEditDialog(makeContact({ id: 5 }), event);

    expect(stopSpy).toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalled();
    expect(contactService.getContacts).toHaveBeenCalledTimes(1);
  });

  it('does not reload after edit dialog dismissed without saving', async () => {
    const { fixture, dialog, contactService } = await renderList({ dialogResult: undefined });
    contactService.getContacts.mockClear();

    const event = new MouseEvent('click', { bubbles: true });
    fixture.componentInstance.openEditDialog(makeContact({ id: 5 }), event);

    expect(dialog.open).toHaveBeenCalled();
    expect(contactService.getContacts).not.toHaveBeenCalled();
  });

  it('confirmDelete calls delete and reloads when confirmed', async () => {
    const { fixture, dialog, contactService, notification } = await renderList({ dialogResult: true });
    contactService.getContacts.mockClear();

    const event = new MouseEvent('click', { bubbles: true });
    const stopSpy = vi.spyOn(event, 'stopPropagation');

    fixture.componentInstance.confirmDelete(makeContact({ id: 9, firstName: 'Ada', lastName: 'Lovelace' }), event);

    expect(stopSpy).toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalled();
    expect(contactService.deleteContact).toHaveBeenCalledWith(9);
    expect(notification.success).toHaveBeenCalledWith('Contact deleted');
    expect(contactService.getContacts).toHaveBeenCalledTimes(1);
  });

  it('confirmDelete does nothing when the user cancels', async () => {
    const { fixture, contactService, notification } = await renderList({ dialogResult: false });
    contactService.getContacts.mockClear();

    fixture.componentInstance.confirmDelete(
      makeContact({ id: 9 }),
      new MouseEvent('click', { bubbles: true }),
    );

    expect(contactService.deleteContact).not.toHaveBeenCalled();
    expect(notification.success).not.toHaveBeenCalled();
    expect(contactService.getContacts).not.toHaveBeenCalled();
  });

  it('does not re-emit on identical search values (distinctUntilChanged)', async () => {
    vi.useFakeTimers();
    const { fixture, contactService } = await renderList();
    contactService.getContacts.mockClear();

    fixture.componentInstance.onSearch('hello');
    vi.advanceTimersByTime(350);
    fixture.componentInstance.onSearch('hello');
    vi.advanceTimersByTime(350);

    expect(contactService.getContacts).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('opens the edit dialog when the row edit button is clicked via DOM', async () => {
    const { fixture, dialog } = await renderList({ dialogResult: false });

    const editIcons = fixture.nativeElement.querySelectorAll('mat-icon');
    const editIcon = Array.from(editIcons).find(
      (el) => (el as HTMLElement).textContent?.trim() === 'edit',
    ) as HTMLElement | undefined;
    const editBtn = editIcon?.closest('button') as HTMLButtonElement;
    await userEvent.click(editBtn);

    expect(dialog.open).toHaveBeenCalled();
  });

  it('opens the confirm dialog when the row delete button is clicked via DOM', async () => {
    const { fixture, dialog } = await renderList({ dialogResult: false });

    const icons = fixture.nativeElement.querySelectorAll('mat-icon');
    const deleteIcon = Array.from(icons).find(
      (el) => (el as HTMLElement).textContent?.trim() === 'delete',
    ) as HTMLElement | undefined;
    const deleteBtn = deleteIcon?.closest('button') as HTMLButtonElement;
    await userEvent.click(deleteBtn);

    expect(dialog.open).toHaveBeenCalled();
  });

  it('reloads when the paginator emits a page event via DOM', async () => {
    const { fixture, contactService } = await renderList();
    contactService.getContacts.mockClear();

    // Set up a meta with multiple pages so the next page button is enabled
    fixture.componentInstance.meta.set({
      currentPage: 1,
      perPage: 10,
      total: 100,
      lastPage: 10,
    });
    fixture.detectChanges();

    const nextButton = screen.getByRole('button', { name: /Next page/i });
    await userEvent.click(nextButton);

    expect(contactService.getContacts).toHaveBeenCalledTimes(1);
    expect(contactService.getContacts).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
    );
  });

  it('triggers onSearch when the user types in the search input', async () => {
    const { fixture, contactService } = await renderList();
    contactService.getContacts.mockClear();

    const input = fixture.nativeElement.querySelector(
      'input[placeholder="Name or email..."]',
    ) as HTMLInputElement;
    input.value = 'ada';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.search).toBe('ada');
  });

  it('triggers onTagFilter when a tag option is selected via the mat-select', async () => {
    const { fixture, contactService } = await renderList();
    contactService.getContacts.mockClear();

    // Find the tag filter mat-select (scoped to the .contacts-filters__tag form field)
    const tagField = fixture.nativeElement.querySelector(
      '.contacts-filters__tag',
    ) as HTMLElement;
    const trigger = tagField.querySelector('.mat-mdc-select-trigger') as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    // The options are rendered in an overlay attached to body
    const options = document.querySelectorAll('mat-option');
    // Click the second option (the first real tag, after the "All tags" entry)
    (options[1] as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(contactService.getContacts).toHaveBeenCalledWith(
      expect.objectContaining({ tagId: 1 }),
    );
  });

  it('renders fallback dashes when row fields are missing', async () => {
    const stubs = makeStubs();
    stubs.contactService.getContacts.mockReturnValue(
      of(
        makePaginated([
          makeContact({
            id: 100,
            firstName: 'No',
            lastName: 'Fields',
            title: null,
            email: null,
            phone: null,
            companyName: null,
            tags: [],
          }),
        ]),
      ),
    );

    await renderWithProviders(ContactListComponent, {
      providers: [
        { provide: ContactService, useValue: stubs.contactService },
        { provide: TagService, useValue: stubs.tagService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    expect(await screen.findByText('No Fields')).toBeInTheDocument();
    // Three falsy fields render '—' fallbacks
    const dashCells = screen.getAllByText('—');
    expect(dashCells.length).toBeGreaterThanOrEqual(3);
  });
});
