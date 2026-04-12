import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/angular';
import { CompanyListComponent } from './company-list.component';
import { CompanyService } from '../services/company.service';
import { NotificationService } from '@core/services/notification.service';
import { renderWithProviders } from '../../../../testing/render';
import { makeCompany, makePaginated } from '../../../../testing/fixtures';

interface CompanyServiceStub {
  getCompanies: ReturnType<typeof vi.fn>;
  deleteCompany: ReturnType<typeof vi.fn>;
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

  const companyService: CompanyServiceStub = {
    getCompanies: vi.fn().mockReturnValue(
      of(makePaginated([makeCompany({ id: 1 }), makeCompany({ id: 2, name: 'Other Co' })])),
    ),
    deleteCompany: vi.fn().mockReturnValue(of(undefined)),
  };
  const notification: NotificationStub = { success: vi.fn() };
  const dialog: DialogStub = { open: vi.fn().mockReturnValue(dialogRef) };

  return { companyService, notification, dialog, dialogRef };
}

async function renderList(overrides?: { dialogResult?: unknown }) {
  const stubs = makeStubs();
  if (overrides?.dialogResult !== undefined) {
    (stubs.dialogRef.afterClosed as ReturnType<typeof vi.fn>).mockReturnValue(of(overrides.dialogResult));
  }

  const result = await renderWithProviders(CompanyListComponent, {
    providers: [
      { provide: CompanyService, useValue: stubs.companyService },
      { provide: NotificationService, useValue: stubs.notification },
      { provide: MatDialog, useValue: stubs.dialog },
    ],
  });

  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  return { ...result, ...stubs, navigate };
}

describe('CompanyListComponent', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('renders companies loaded on init', async () => {
    await renderList();
    expect(await screen.findByText('Acme Inc')).toBeInTheDocument();
    expect(screen.getByText('Other Co')).toBeInTheDocument();
  });

  it('shows the empty state when there are no companies and loading is finished', async () => {
    const stubs = makeStubs();
    stubs.companyService.getCompanies.mockReturnValue(of(makePaginated([])));

    await renderWithProviders(CompanyListComponent, {
      providers: [
        { provide: CompanyService, useValue: stubs.companyService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    expect(await screen.findByText('No companies yet')).toBeInTheDocument();
  });

  it('debounces search input then reloads with the new term', async () => {
    vi.useFakeTimers();
    const { fixture, companyService } = await renderList();
    companyService.getCompanies.mockClear();

    const component = fixture.componentInstance;
    component.onSearch('ac');
    component.onSearch('acme');

    vi.advanceTimersByTime(350);
    await fixture.whenStable();

    expect(companyService.getCompanies).toHaveBeenCalledTimes(1);
    expect(companyService.getCompanies).toHaveBeenLastCalledWith(1, 10, 'acme');
    vi.useRealTimers();
  });

  it('does not re-emit on identical search values (distinctUntilChanged)', async () => {
    vi.useFakeTimers();
    const { fixture, companyService } = await renderList();
    companyService.getCompanies.mockClear();

    fixture.componentInstance.onSearch('hello');
    vi.advanceTimersByTime(350);
    fixture.componentInstance.onSearch('hello');
    vi.advanceTimersByTime(350);

    expect(companyService.getCompanies).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('passes undefined search when the value is empty', async () => {
    const { fixture, companyService } = await renderList();
    companyService.getCompanies.mockClear();

    fixture.componentInstance.search = '';
    fixture.componentInstance.loadCompanies();

    expect(companyService.getCompanies).toHaveBeenCalledWith(1, 10, undefined);
  });

  it('handles getCompanies error by clearing loading', async () => {
    const stubs = makeStubs();
    stubs.companyService.getCompanies.mockReturnValueOnce(throwError(() => new Error('boom')));

    const { fixture } = await renderWithProviders(CompanyListComponent, {
      providers: [
        { provide: CompanyService, useValue: stubs.companyService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('reloads on pagination event with new page index and size', async () => {
    const { fixture, companyService } = await renderList();
    companyService.getCompanies.mockClear();

    fixture.componentInstance.onPage({ pageIndex: 3, pageSize: 25, length: 100 });

    expect(companyService.getCompanies).toHaveBeenLastCalledWith(4, 25, undefined);
  });

  it('navigates to the company detail when a row is clicked', async () => {
    const { navigate } = await renderList();
    const rows = await screen.findAllByRole('row');
    // first row is the header; click the first data row
    await userEvent.click(rows[1]);
    expect(navigate).toHaveBeenCalledWith(['/companies', 1]);
  });

  it('opens the create dialog and reloads when it returns a truthy result', async () => {
    const { dialog, companyService } = await renderList({ dialogResult: true });
    companyService.getCompanies.mockClear();

    const addBtn = screen.getByRole('button', { name: /Add Company/i });
    await userEvent.click(addBtn);

    expect(dialog.open).toHaveBeenCalled();
    expect(companyService.getCompanies).toHaveBeenCalledTimes(1);
  });

  it('does not reload after create dialog is dismissed without saving', async () => {
    const { dialog, companyService } = await renderList({ dialogResult: false });
    companyService.getCompanies.mockClear();

    const addBtn = screen.getByRole('button', { name: /Add Company/i });
    await userEvent.click(addBtn);

    expect(dialog.open).toHaveBeenCalled();
    expect(companyService.getCompanies).not.toHaveBeenCalled();
  });

  it('opens the empty-state add button when there are no companies', async () => {
    const stubs = makeStubs();
    stubs.companyService.getCompanies.mockReturnValue(of(makePaginated([])));
    (stubs.dialogRef.afterClosed as ReturnType<typeof vi.fn>).mockReturnValue(of(true));

    await renderWithProviders(CompanyListComponent, {
      providers: [
        { provide: CompanyService, useValue: stubs.companyService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    const buttons = await screen.findAllByRole('button', { name: /Add Company/i });
    await userEvent.click(buttons[buttons.length - 1]);
    expect(stubs.dialog.open).toHaveBeenCalled();
  });

  it('opens the edit dialog and stops row click propagation', async () => {
    const { fixture, dialog, companyService } = await renderList({ dialogResult: true });
    companyService.getCompanies.mockClear();

    const event = new MouseEvent('click', { bubbles: true });
    const stopSpy = vi.spyOn(event, 'stopPropagation');

    fixture.componentInstance.openEditDialog(makeCompany({ id: 5 }), event);

    expect(stopSpy).toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalled();
    expect(companyService.getCompanies).toHaveBeenCalledTimes(1);
  });

  it('does not reload after edit dialog dismissed without saving', async () => {
    const { fixture, dialog, companyService } = await renderList({ dialogResult: undefined });
    companyService.getCompanies.mockClear();

    const event = new MouseEvent('click', { bubbles: true });
    fixture.componentInstance.openEditDialog(makeCompany({ id: 5 }), event);

    expect(dialog.open).toHaveBeenCalled();
    expect(companyService.getCompanies).not.toHaveBeenCalled();
  });

  it('confirmDelete calls delete and reloads when confirmed', async () => {
    const { fixture, dialog, companyService, notification } = await renderList({ dialogResult: true });
    companyService.getCompanies.mockClear();

    const event = new MouseEvent('click', { bubbles: true });
    const stopSpy = vi.spyOn(event, 'stopPropagation');

    fixture.componentInstance.confirmDelete(makeCompany({ id: 9, name: 'Acme Inc' }), event);

    expect(stopSpy).toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalled();
    expect(companyService.deleteCompany).toHaveBeenCalledWith(9);
    expect(notification.success).toHaveBeenCalledWith('Company deleted');
    expect(companyService.getCompanies).toHaveBeenCalledTimes(1);
  });

  it('confirmDelete does nothing when the user cancels', async () => {
    const { fixture, companyService, notification } = await renderList({ dialogResult: false });
    companyService.getCompanies.mockClear();

    fixture.componentInstance.confirmDelete(
      makeCompany({ id: 9 }),
      new MouseEvent('click', { bubbles: true }),
    );

    expect(companyService.deleteCompany).not.toHaveBeenCalled();
    expect(notification.success).not.toHaveBeenCalled();
    expect(companyService.getCompanies).not.toHaveBeenCalled();
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
    const { fixture, companyService } = await renderList();
    companyService.getCompanies.mockClear();

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

    expect(companyService.getCompanies).toHaveBeenCalledTimes(1);
    expect(companyService.getCompanies).toHaveBeenLastCalledWith(2, 10, undefined);
  });

  it('triggers onSearch when the user types in the search input', async () => {
    const { fixture, companyService } = await renderList();
    companyService.getCompanies.mockClear();

    const input = fixture.nativeElement.querySelector(
      'input[placeholder="Company name..."]',
    ) as HTMLInputElement;
    input.value = 'acme';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.search).toBe('acme');
  });

  it('renders fallback dashes when location and industry are missing', async () => {
    const stubs = makeStubs();
    stubs.companyService.getCompanies.mockReturnValue(
      of(
        makePaginated([
          makeCompany({
            id: 100,
            name: 'No Location Co',
            industry: null,
            city: null,
            state: null,
          }),
        ]),
      ),
    );

    await renderWithProviders(CompanyListComponent, {
      providers: [
        { provide: CompanyService, useValue: stubs.companyService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    expect(await screen.findByText('No Location Co')).toBeInTheDocument();
    // Two falsy fields render '—' fallbacks (industry and location)
    const dashCells = screen.getAllByText('—');
    expect(dashCells.length).toBeGreaterThanOrEqual(2);
  });

  it('renders the city and state location fragment with the comma separator', async () => {
    const stubs = makeStubs();
    stubs.companyService.getCompanies.mockReturnValue(
      of(makePaginated([makeCompany({ id: 1, city: 'Springfield', state: 'IL' })])),
    );

    await renderWithProviders(CompanyListComponent, {
      providers: [
        { provide: CompanyService, useValue: stubs.companyService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    expect(await screen.findByText(/Springfield, IL/)).toBeInTheDocument();
  });

  it('renders only the city when state is missing', async () => {
    const stubs = makeStubs();
    stubs.companyService.getCompanies.mockReturnValue(
      of(makePaginated([makeCompany({ id: 1, city: 'Springfield', state: null })])),
    );

    await renderWithProviders(CompanyListComponent, {
      providers: [
        { provide: CompanyService, useValue: stubs.companyService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    const cells = await screen.findAllByRole('cell');
    const locationCell = cells.find((c) => c.textContent?.trim() === 'Springfield');
    expect(locationCell).toBeDefined();
  });
});
