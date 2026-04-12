import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/angular';
import { ActivityListComponent } from './activity-list.component';
import { ActivityService } from '../services/activity.service';
import { NotificationService } from '@core/services/notification.service';
import { renderWithProviders } from '../../../../testing/render';
import { makeActivity, makePaginated } from '../../../../testing/fixtures';

interface ActivityServiceStub {
  getActivities: ReturnType<typeof vi.fn>;
  deleteActivity: ReturnType<typeof vi.fn>;
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

  const activityService: ActivityServiceStub = {
    getActivities: vi.fn().mockReturnValue(
      of(
        makePaginated([
          makeActivity({ id: 1, subject: 'Followed up' }),
          makeActivity({
            id: 2,
            subject: 'Called the client',
            type: 'Call',
            contactId: null,
            contactName: null,
            dealId: null,
            dealTitle: null,
          }),
        ]),
      ),
    ),
    deleteActivity: vi.fn().mockReturnValue(of(undefined)),
  };
  const notification: NotificationStub = { success: vi.fn() };
  const dialog: DialogStub = { open: vi.fn().mockReturnValue(dialogRef) };

  return { activityService, notification, dialog, dialogRef };
}

async function renderList(overrides?: { dialogResult?: unknown }) {
  const stubs = makeStubs();
  if (overrides?.dialogResult !== undefined) {
    (stubs.dialogRef.afterClosed as ReturnType<typeof vi.fn>).mockReturnValue(of(overrides.dialogResult));
  }

  const result = await renderWithProviders(ActivityListComponent, {
    routes: [
      { path: 'contacts/:id', children: [] },
      { path: 'deals/:id', children: [] },
    ],
    providers: [
      { provide: ActivityService, useValue: stubs.activityService },
      { provide: NotificationService, useValue: stubs.notification },
      { provide: MatDialog, useValue: stubs.dialog },
    ],
  });

  return { ...result, ...stubs };
}

describe('ActivityListComponent', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('renders activities loaded on init', async () => {
    await renderList();
    expect(await screen.findByText('Followed up')).toBeInTheDocument();
    expect(screen.getByText('Called the client')).toBeInTheDocument();
  });

  it('shows the empty state when there are no activities and loading is finished', async () => {
    const stubs = makeStubs();
    stubs.activityService.getActivities.mockReturnValue(of(makePaginated([])));

    await renderWithProviders(ActivityListComponent, {
      providers: [
        { provide: ActivityService, useValue: stubs.activityService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    expect(await screen.findByText('No activities yet')).toBeInTheDocument();
  });

  it('handles getActivities error by clearing loading', async () => {
    const stubs = makeStubs();
    stubs.activityService.getActivities.mockReturnValueOnce(throwError(() => new Error('boom')));

    const { fixture } = await renderWithProviders(ActivityListComponent, {
      providers: [
        { provide: ActivityService, useValue: stubs.activityService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('reloads with the selected type when the filter changes and resets to page 1', async () => {
    const { fixture, activityService } = await renderList();
    activityService.getActivities.mockClear();

    const component = fixture.componentInstance;
    component.meta.set({ currentPage: 5, perPage: 10, total: 100, lastPage: 10 });
    component.onTypeFilter('Call');

    expect(component.selectedType).toBe('Call');
    expect(component.meta().currentPage).toBe(1);
    expect(activityService.getActivities).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'Call', page: 1 }),
    );
  });

  it('passes type undefined when the "All types" option is selected', async () => {
    const { fixture, activityService } = await renderList();
    activityService.getActivities.mockClear();

    fixture.componentInstance.onTypeFilter('');

    expect(activityService.getActivities).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: undefined }),
    );
  });

  it('reloads on pagination event with the new page index and size', async () => {
    const { fixture, activityService } = await renderList();
    activityService.getActivities.mockClear();

    fixture.componentInstance.onPage({ pageIndex: 3, pageSize: 25, length: 100 });

    expect(activityService.getActivities).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 4, perPage: 25 }),
    );
  });

  it('opens the create dialog and reloads when it returns a truthy result', async () => {
    const { dialog, activityService } = await renderList({ dialogResult: true });
    activityService.getActivities.mockClear();

    const addBtn = screen.getByRole('button', { name: /Log Activity/i });
    await userEvent.click(addBtn);

    expect(dialog.open).toHaveBeenCalled();
    expect(activityService.getActivities).toHaveBeenCalledTimes(1);
  });

  it('does not reload after the create dialog is dismissed without saving', async () => {
    const { dialog, activityService } = await renderList({ dialogResult: false });
    activityService.getActivities.mockClear();

    const addBtn = screen.getByRole('button', { name: /Log Activity/i });
    await userEvent.click(addBtn);

    expect(dialog.open).toHaveBeenCalled();
    expect(activityService.getActivities).not.toHaveBeenCalled();
  });

  it('opens the empty-state add button when there are no activities', async () => {
    const stubs = makeStubs();
    stubs.activityService.getActivities.mockReturnValue(of(makePaginated([])));
    (stubs.dialogRef.afterClosed as ReturnType<typeof vi.fn>).mockReturnValue(of(true));

    await renderWithProviders(ActivityListComponent, {
      providers: [
        { provide: ActivityService, useValue: stubs.activityService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    const buttons = await screen.findAllByRole('button', { name: /Log Activity/i });
    await userEvent.click(buttons[buttons.length - 1]);
    expect(stubs.dialog.open).toHaveBeenCalled();
  });

  it('opens the edit dialog and stops row click propagation', async () => {
    const { fixture, dialog, activityService } = await renderList({ dialogResult: true });
    activityService.getActivities.mockClear();

    const event = new MouseEvent('click', { bubbles: true });
    const stopSpy = vi.spyOn(event, 'stopPropagation');

    fixture.componentInstance.openEditDialog(makeActivity({ id: 5 }), event);

    expect(stopSpy).toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalled();
    expect(activityService.getActivities).toHaveBeenCalledTimes(1);
  });

  it('does not reload after the edit dialog is dismissed without saving', async () => {
    const { fixture, dialog, activityService } = await renderList({ dialogResult: undefined });
    activityService.getActivities.mockClear();

    const event = new MouseEvent('click', { bubbles: true });
    fixture.componentInstance.openEditDialog(makeActivity({ id: 5 }), event);

    expect(dialog.open).toHaveBeenCalled();
    expect(activityService.getActivities).not.toHaveBeenCalled();
  });

  it('confirmDelete calls delete and reloads when confirmed', async () => {
    const { fixture, dialog, activityService, notification } = await renderList({
      dialogResult: true,
    });
    activityService.getActivities.mockClear();

    const event = new MouseEvent('click', { bubbles: true });
    const stopSpy = vi.spyOn(event, 'stopPropagation');

    fixture.componentInstance.confirmDelete(
      makeActivity({ id: 9, subject: 'Followed up' }),
      event,
    );

    expect(stopSpy).toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalled();
    expect(activityService.deleteActivity).toHaveBeenCalledWith(9);
    expect(notification.success).toHaveBeenCalledWith('Activity deleted');
    expect(activityService.getActivities).toHaveBeenCalledTimes(1);
  });

  it('confirmDelete does nothing when the user cancels', async () => {
    const { fixture, activityService, notification } = await renderList({ dialogResult: false });
    activityService.getActivities.mockClear();

    fixture.componentInstance.confirmDelete(
      makeActivity({ id: 9 }),
      new MouseEvent('click', { bubbles: true }),
    );

    expect(activityService.deleteActivity).not.toHaveBeenCalled();
    expect(notification.success).not.toHaveBeenCalled();
    expect(activityService.getActivities).not.toHaveBeenCalled();
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
    const { fixture, activityService } = await renderList();
    activityService.getActivities.mockClear();

    fixture.componentInstance.meta.set({
      currentPage: 1,
      perPage: 10,
      total: 100,
      lastPage: 10,
    });
    fixture.detectChanges();

    const nextButton = screen.getByRole('button', { name: /Next page/i });
    await userEvent.click(nextButton);

    expect(activityService.getActivities).toHaveBeenCalledTimes(1);
    expect(activityService.getActivities).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
    );
  });

  it('triggers onTypeFilter when a type option is selected via the mat-select', async () => {
    const { fixture, activityService } = await renderList();
    activityService.getActivities.mockClear();

    const tagField = fixture.nativeElement.querySelector(
      '.activities-filters__type',
    ) as HTMLElement;
    const trigger = tagField.querySelector('.mat-mdc-select-trigger') as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const options = document.querySelectorAll('mat-option');
    // Click the second option (the first concrete type, after "All types")
    (options[1] as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(activityService.getActivities).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'Note' }),
    );
  });

  it('renders fallback dashes when the contact and deal references are missing', async () => {
    await renderList();
    // The second row in the default fixture has contactId and dealId set to null,
    // which renders an em-dash in both the contact and deal columns.
    const dashCells = screen.getAllByText('—');
    expect(dashCells.length).toBeGreaterThanOrEqual(2);
  });

  it('renders router links when the contact and deal references are present', async () => {
    await renderList();
    // The first row has a contact name and deal title rendered as links.
    expect(await screen.findByRole('link', { name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Big Deal' })).toBeInTheDocument();
  });
});
