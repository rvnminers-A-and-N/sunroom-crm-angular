import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/angular';
import { UserManagementComponent } from './user-management.component';
import { UserManagementService } from '../services/user-management.service';
import { NotificationService } from '@core/services/notification.service';
import { renderWithProviders } from '../../../../testing/render';
import { makeUser } from '../../../../testing/fixtures';

interface UserManagementServiceStub {
  getUsers: ReturnType<typeof vi.fn>;
  updateUser: ReturnType<typeof vi.fn>;
  deleteUser: ReturnType<typeof vi.fn>;
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

  const userService: UserManagementServiceStub = {
    getUsers: vi.fn().mockReturnValue(
      of([
        makeUser({ id: 1, name: 'Ada Lovelace', email: 'ada@example.com', role: 'Admin' }),
        makeUser({ id: 2, name: 'Grace Hopper', email: 'grace@example.com', role: 'User' }),
      ]),
    ),
    updateUser: vi.fn().mockReturnValue(of(makeUser({ id: 1 }))),
    deleteUser: vi.fn().mockReturnValue(of(undefined)),
  };
  const notification: NotificationStub = { success: vi.fn() };
  const dialog: DialogStub = { open: vi.fn().mockReturnValue(dialogRef) };

  return { userService, notification, dialog, dialogRef };
}

async function renderList(overrides?: { dialogResult?: unknown }) {
  const stubs = makeStubs();
  if (overrides?.dialogResult !== undefined) {
    (stubs.dialogRef.afterClosed as ReturnType<typeof vi.fn>).mockReturnValue(of(overrides.dialogResult));
  }

  const result = await renderWithProviders(UserManagementComponent, {
    providers: [
      { provide: UserManagementService, useValue: stubs.userService },
      { provide: NotificationService, useValue: stubs.notification },
      { provide: MatDialog, useValue: stubs.dialog },
    ],
  });

  return { ...result, ...stubs };
}

describe('UserManagementComponent', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('renders users loaded on init', async () => {
    await renderList();
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
  });

  it('shows the empty placeholder when there are no users and loading is finished', async () => {
    const stubs = makeStubs();
    stubs.userService.getUsers.mockReturnValue(of([]));

    await renderWithProviders(UserManagementComponent, {
      providers: [
        { provide: UserManagementService, useValue: stubs.userService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    expect(await screen.findByText('No users found.')).toBeInTheDocument();
  });

  it('clears loading when getUsers errors', async () => {
    const stubs = makeStubs();
    stubs.userService.getUsers.mockReturnValueOnce(throwError(() => new Error('boom')));

    const { fixture } = await renderWithProviders(UserManagementComponent, {
      providers: [
        { provide: UserManagementService, useValue: stubs.userService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('updates the role and shows a success notification when updateUser succeeds', async () => {
    const { fixture, userService, notification } = await renderList();

    const user = makeUser({ id: 7, name: 'Linus' });
    fixture.componentInstance.onRoleChange(user, 'Admin');

    expect(userService.updateUser).toHaveBeenCalledWith(7, { role: 'Admin' });
    expect(notification.success).toHaveBeenCalledWith('Linus updated to Admin');
  });

  it('reloads the users list when updateUser errors', async () => {
    const { fixture, userService } = await renderList();
    userService.updateUser.mockReturnValueOnce(throwError(() => new Error('nope')));
    userService.getUsers.mockClear();

    fixture.componentInstance.onRoleChange(makeUser({ id: 1 }), 'Admin');

    expect(userService.getUsers).toHaveBeenCalledTimes(1);
  });

  it('confirmDelete deletes the user and reloads when confirmed', async () => {
    const { fixture, dialog, userService, notification } = await renderList({ dialogResult: true });
    userService.getUsers.mockClear();

    fixture.componentInstance.confirmDelete(makeUser({ id: 9, name: 'Linus' }));

    expect(dialog.open).toHaveBeenCalled();
    expect(userService.deleteUser).toHaveBeenCalledWith(9);
    expect(notification.success).toHaveBeenCalledWith('User deleted');
    expect(userService.getUsers).toHaveBeenCalledTimes(1);
  });

  it('confirmDelete does nothing when the user cancels', async () => {
    const { fixture, userService, notification } = await renderList({ dialogResult: false });
    userService.getUsers.mockClear();

    fixture.componentInstance.confirmDelete(makeUser({ id: 9 }));

    expect(userService.deleteUser).not.toHaveBeenCalled();
    expect(notification.success).not.toHaveBeenCalled();
    expect(userService.getUsers).not.toHaveBeenCalled();
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

  it('updates the role when an option is selected via the role mat-select', async () => {
    const { fixture, userService } = await renderList();
    userService.updateUser.mockClear();

    const select = fixture.nativeElement.querySelector(
      '.users-table__role-select .mat-mdc-select-trigger',
    ) as HTMLElement;
    select.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const options = document.querySelectorAll('mat-option');
    // The first row's user is already 'Admin' so click 'User' (the first option) to trigger a change.
    (options[0] as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(userService.updateUser).toHaveBeenCalled();
  });
});
