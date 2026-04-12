import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/angular';
import { DealListComponent } from './deal-list.component';
import { DealService } from '../services/deal.service';
import { NotificationService } from '@core/services/notification.service';
import { renderWithProviders } from '../../../../testing/render';
import { makeDeal, makePaginated } from '../../../../testing/fixtures';

interface DealServiceStub {
  getDeals: ReturnType<typeof vi.fn>;
  deleteDeal: ReturnType<typeof vi.fn>;
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

  const dealService: DealServiceStub = {
    getDeals: vi.fn().mockReturnValue(
      of(makePaginated([makeDeal({ id: 1 }), makeDeal({ id: 2, title: 'Smaller Deal' })])),
    ),
    deleteDeal: vi.fn().mockReturnValue(of(undefined)),
  };
  const notification: NotificationStub = { success: vi.fn() };
  const dialog: DialogStub = { open: vi.fn().mockReturnValue(dialogRef) };

  return { dealService, notification, dialog, dialogRef };
}

async function renderList(overrides?: { dialogResult?: unknown }) {
  const stubs = makeStubs();
  if (overrides?.dialogResult !== undefined) {
    (stubs.dialogRef.afterClosed as ReturnType<typeof vi.fn>).mockReturnValue(of(overrides.dialogResult));
  }

  const result = await renderWithProviders(DealListComponent, {
    routes: [{ path: 'deals', children: [] }, { path: 'deals/pipeline', children: [] }],
    providers: [
      { provide: DealService, useValue: stubs.dealService },
      { provide: NotificationService, useValue: stubs.notification },
      { provide: MatDialog, useValue: stubs.dialog },
    ],
  });

  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  return { ...result, ...stubs, navigate };
}

describe('DealListComponent', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('renders deals loaded on init', async () => {
    await renderList();
    expect(await screen.findByText('Big Deal')).toBeInTheDocument();
    expect(screen.getByText('Smaller Deal')).toBeInTheDocument();
  });

  it('shows the empty state when there are no deals and loading is finished', async () => {
    const stubs = makeStubs();
    stubs.dealService.getDeals.mockReturnValue(of(makePaginated([])));

    await renderWithProviders(DealListComponent, {
      routes: [{ path: 'deals', children: [] }, { path: 'deals/pipeline', children: [] }],
      providers: [
        { provide: DealService, useValue: stubs.dealService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    expect(await screen.findByText('No deals yet')).toBeInTheDocument();
  });

  it('debounces search input then reloads with the new term', async () => {
    vi.useFakeTimers();
    const { fixture, dealService } = await renderList();
    dealService.getDeals.mockClear();

    const component = fixture.componentInstance;
    component.onSearch('big');
    component.onSearch('biggest');

    vi.advanceTimersByTime(350);
    await fixture.whenStable();

    expect(dealService.getDeals).toHaveBeenCalledTimes(1);
    expect(dealService.getDeals).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'biggest', page: 1 }),
    );
    vi.useRealTimers();
  });

  it('reloads with selected stage when filter changes and resets to page 1', async () => {
    const { fixture, dealService } = await renderList();
    dealService.getDeals.mockClear();

    const component = fixture.componentInstance;
    component.meta.set({ currentPage: 5, perPage: 10, total: 100, lastPage: 10 });
    component.onStageFilter('Won');

    expect(component.selectedStage).toBe('Won');
    expect(component.meta().currentPage).toBe(1);
    expect(dealService.getDeals).toHaveBeenLastCalledWith(
      expect.objectContaining({ stage: 'Won', page: 1 }),
    );
  });

  it('handles getDeals error by clearing loading', async () => {
    const stubs = makeStubs();
    stubs.dealService.getDeals.mockReturnValueOnce(throwError(() => new Error('boom')));

    const { fixture } = await renderWithProviders(DealListComponent, {
      routes: [{ path: 'deals', children: [] }, { path: 'deals/pipeline', children: [] }],
      providers: [
        { provide: DealService, useValue: stubs.dealService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('reloads on pagination event with new page index and size', async () => {
    const { fixture, dealService } = await renderList();
    dealService.getDeals.mockClear();

    fixture.componentInstance.onPage({ pageIndex: 3, pageSize: 25, length: 100 });

    expect(dealService.getDeals).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 4, perPage: 25 }),
    );
  });

  it('navigates to the deal detail when a row is clicked', async () => {
    const { navigate } = await renderList();
    const rows = await screen.findAllByRole('row');
    await userEvent.click(rows[1]);
    expect(navigate).toHaveBeenCalledWith(['/deals', 1]);
  });

  it('opens the create dialog and reloads when it returns a truthy result', async () => {
    const { dialog, dealService } = await renderList({ dialogResult: true });
    dealService.getDeals.mockClear();

    const addBtn = screen.getByRole('button', { name: /Add Deal/i });
    await userEvent.click(addBtn);

    expect(dialog.open).toHaveBeenCalled();
    expect(dealService.getDeals).toHaveBeenCalledTimes(1);
  });

  it('does not reload after create dialog is dismissed without saving', async () => {
    const { dialog, dealService } = await renderList({ dialogResult: false });
    dealService.getDeals.mockClear();

    const addBtn = screen.getByRole('button', { name: /Add Deal/i });
    await userEvent.click(addBtn);

    expect(dialog.open).toHaveBeenCalled();
    expect(dealService.getDeals).not.toHaveBeenCalled();
  });

  it('opens the empty-state add button when there are no deals', async () => {
    const stubs = makeStubs();
    stubs.dealService.getDeals.mockReturnValue(of(makePaginated([])));
    (stubs.dialogRef.afterClosed as ReturnType<typeof vi.fn>).mockReturnValue(of(true));

    await renderWithProviders(DealListComponent, {
      routes: [{ path: 'deals', children: [] }, { path: 'deals/pipeline', children: [] }],
      providers: [
        { provide: DealService, useValue: stubs.dealService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    const buttons = await screen.findAllByRole('button', { name: /Add Deal/i });
    await userEvent.click(buttons[buttons.length - 1]);
    expect(stubs.dialog.open).toHaveBeenCalled();
  });

  it('opens the edit dialog and stops row click propagation', async () => {
    const { fixture, dialog, dealService } = await renderList({ dialogResult: true });
    dealService.getDeals.mockClear();

    const event = new MouseEvent('click', { bubbles: true });
    const stopSpy = vi.spyOn(event, 'stopPropagation');

    fixture.componentInstance.openEditDialog(makeDeal({ id: 5 }), event);

    expect(stopSpy).toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalled();
    expect(dealService.getDeals).toHaveBeenCalledTimes(1);
  });

  it('does not reload after edit dialog dismissed without saving', async () => {
    const { fixture, dialog, dealService } = await renderList({ dialogResult: undefined });
    dealService.getDeals.mockClear();

    const event = new MouseEvent('click', { bubbles: true });
    fixture.componentInstance.openEditDialog(makeDeal({ id: 5 }), event);

    expect(dialog.open).toHaveBeenCalled();
    expect(dealService.getDeals).not.toHaveBeenCalled();
  });

  it('confirmDelete calls delete and reloads when confirmed', async () => {
    const { fixture, dialog, dealService, notification } = await renderList({ dialogResult: true });
    dealService.getDeals.mockClear();

    const event = new MouseEvent('click', { bubbles: true });
    const stopSpy = vi.spyOn(event, 'stopPropagation');

    fixture.componentInstance.confirmDelete(makeDeal({ id: 9, title: 'Big Deal' }), event);

    expect(stopSpy).toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalled();
    expect(dealService.deleteDeal).toHaveBeenCalledWith(9);
    expect(notification.success).toHaveBeenCalledWith('Deal deleted');
    expect(dealService.getDeals).toHaveBeenCalledTimes(1);
  });

  it('confirmDelete does nothing when the user cancels', async () => {
    const { fixture, dealService, notification } = await renderList({ dialogResult: false });
    dealService.getDeals.mockClear();

    fixture.componentInstance.confirmDelete(
      makeDeal({ id: 9 }),
      new MouseEvent('click', { bubbles: true }),
    );

    expect(dealService.deleteDeal).not.toHaveBeenCalled();
    expect(notification.success).not.toHaveBeenCalled();
    expect(dealService.getDeals).not.toHaveBeenCalled();
  });

  it('does not re-emit on identical search values (distinctUntilChanged)', async () => {
    vi.useFakeTimers();
    const { fixture, dealService } = await renderList();
    dealService.getDeals.mockClear();

    fixture.componentInstance.onSearch('hello');
    vi.advanceTimersByTime(350);
    fixture.componentInstance.onSearch('hello');
    vi.advanceTimersByTime(350);

    expect(dealService.getDeals).toHaveBeenCalledTimes(1);
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
    const { fixture, dealService } = await renderList();
    dealService.getDeals.mockClear();

    fixture.componentInstance.meta.set({
      currentPage: 1,
      perPage: 10,
      total: 100,
      lastPage: 10,
    });
    fixture.detectChanges();

    const nextButton = screen.getByRole('button', { name: /Next page/i });
    await userEvent.click(nextButton);

    expect(dealService.getDeals).toHaveBeenCalledTimes(1);
    expect(dealService.getDeals).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
    );
  });

  it('triggers onSearch when the user types in the search input', async () => {
    const { fixture, dealService } = await renderList();
    dealService.getDeals.mockClear();

    const input = fixture.nativeElement.querySelector(
      'input[placeholder="Title..."]',
    ) as HTMLInputElement;
    input.value = 'big';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.search).toBe('big');
  });

  it('triggers onStageFilter when a stage option is selected via the mat-select', async () => {
    const { fixture, dealService } = await renderList();
    dealService.getDeals.mockClear();

    const stageField = fixture.nativeElement.querySelector(
      '.deals-filters__stage',
    ) as HTMLElement;
    const trigger = stageField.querySelector('.mat-mdc-select-trigger') as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const options = document.querySelectorAll('mat-option');
    // Click the second option (the first real stage, after the "All stages" entry)
    (options[1] as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dealService.getDeals).toHaveBeenCalledWith(
      expect.objectContaining({ stage: 'Lead' }),
    );
  });

  it('renders fallback dashes when companyName and expectedCloseDate are missing', async () => {
    const stubs = makeStubs();
    stubs.dealService.getDeals.mockReturnValue(
      of(
        makePaginated([
          makeDeal({
            id: 100,
            title: 'Bare Deal',
            companyName: null,
            expectedCloseDate: null,
          }),
        ]),
      ),
    );

    await renderWithProviders(DealListComponent, {
      routes: [{ path: 'deals', children: [] }, { path: 'deals/pipeline', children: [] }],
      providers: [
        { provide: DealService, useValue: stubs.dealService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    expect(await screen.findByText('Bare Deal')).toBeInTheDocument();
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('getStageClass returns the lower-cased stage modifier', async () => {
    const { fixture } = await renderList();
    expect(fixture.componentInstance.getStageClass('Won')).toBe('stage-badge stage-badge--won');
    expect(fixture.componentInstance.getStageClass('Lead')).toBe('stage-badge stage-badge--lead');
  });
});
