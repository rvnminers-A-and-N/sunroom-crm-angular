import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BehaviorSubject, of } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { screen } from '@testing-library/angular';
import { ProfileComponent } from './profile.component';
import { AuthService } from '@core/services/auth.service';
import { TagService } from '@core/services/tag.service';
import { NotificationService } from '@core/services/notification.service';
import { renderWithProviders } from '../../../../testing/render';
import { makeUser, makeTag } from '../../../../testing/fixtures';
import type { User } from '@core/models/user.model';

interface AuthServiceStub {
  currentUser$: BehaviorSubject<User | null>;
  loadCurrentUser: ReturnType<typeof vi.fn>;
}

interface TagServiceStub {
  getTags: ReturnType<typeof vi.fn>;
  createTag: ReturnType<typeof vi.fn>;
  updateTag: ReturnType<typeof vi.fn>;
  deleteTag: ReturnType<typeof vi.fn>;
}

interface NotificationStub {
  success: ReturnType<typeof vi.fn>;
}

interface DialogStub {
  open: ReturnType<typeof vi.fn>;
}

function makeStubs(initialUser: User | null = makeUser()) {
  const dialogRef = {
    afterClosed: vi.fn().mockReturnValue(of(undefined)),
  } as unknown as MatDialogRef<unknown>;

  const authService: AuthServiceStub = {
    currentUser$: new BehaviorSubject<User | null>(initialUser),
    loadCurrentUser: vi.fn().mockReturnValue(of(makeUser())),
  };
  const tagService: TagServiceStub = {
    getTags: vi.fn().mockReturnValue(of([makeTag({ id: 1 }), makeTag({ id: 2, name: 'Lead' })])),
    createTag: vi.fn().mockReturnValue(of(makeTag({ id: 3 }))),
    updateTag: vi.fn().mockReturnValue(of(makeTag({ id: 1 }))),
    deleteTag: vi.fn().mockReturnValue(of(undefined)),
  };
  const notification: NotificationStub = { success: vi.fn() };
  const dialog: DialogStub = { open: vi.fn().mockReturnValue(dialogRef) };

  return { authService, tagService, notification, dialog, dialogRef };
}

async function renderProfile(overrides?: { initialUser?: User | null; dialogResult?: unknown }) {
  const stubs = makeStubs(overrides?.initialUser);
  if (overrides?.dialogResult !== undefined) {
    (stubs.dialogRef.afterClosed as ReturnType<typeof vi.fn>).mockReturnValue(of(overrides.dialogResult));
  }

  const result = await renderWithProviders(ProfileComponent, {
    providers: [
      { provide: AuthService, useValue: stubs.authService },
      { provide: TagService, useValue: stubs.tagService },
      { provide: NotificationService, useValue: stubs.notification },
      { provide: MatDialog, useValue: stubs.dialog },
    ],
  });

  return { ...result, ...stubs };
}

describe('ProfileComponent', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('renders the profile and tag list when a user is already loaded', async () => {
    await renderProfile();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(await screen.findByText('Test User')).toBeInTheDocument();
  });

  it('triggers loadCurrentUser when there is no current user yet', async () => {
    const { authService } = await renderProfile({ initialUser: null });
    expect(authService.loadCurrentUser).toHaveBeenCalled();
  });

  it('does not call loadCurrentUser when there is already a current user', async () => {
    const { authService } = await renderProfile();
    expect(authService.loadCurrentUser).not.toHaveBeenCalled();
  });

  it('createTag does nothing when the new name is whitespace', async () => {
    const { fixture, tagService } = await renderProfile();
    fixture.componentInstance.newTagName = '   ';
    fixture.componentInstance.createTag();
    expect(tagService.createTag).not.toHaveBeenCalled();
  });

  it('createTag posts the trimmed name and reloads the tags on success', async () => {
    const { fixture, tagService, notification } = await renderProfile();
    tagService.getTags.mockClear();

    fixture.componentInstance.newTagName = '  New  ';
    fixture.componentInstance.newTagColor = '#abcdef';
    fixture.componentInstance.createTag();

    expect(tagService.createTag).toHaveBeenCalledWith({ name: 'New', color: '#abcdef' });
    expect(notification.success).toHaveBeenCalledWith('Tag created');
    expect(fixture.componentInstance.newTagName).toBe('');
    expect(fixture.componentInstance.newTagColor).toBe('#02795f');
    expect(tagService.getTags).toHaveBeenCalledTimes(1);
  });

  it('startEditTag seeds the edit fields and stores the editing tag', async () => {
    const { fixture } = await renderProfile();
    const tag = makeTag({ id: 5, name: 'VIP', color: '#000000' });
    fixture.componentInstance.startEditTag(tag);
    expect(fixture.componentInstance.editingTag()).toEqual(tag);
    expect(fixture.componentInstance.editTagName).toBe('VIP');
    expect(fixture.componentInstance.editTagColor).toBe('#000000');
  });

  it('saveEditTag does nothing when there is no editing tag', async () => {
    const { fixture, tagService } = await renderProfile();
    fixture.componentInstance.editingTag.set(null);
    fixture.componentInstance.editTagName = 'Updated';
    fixture.componentInstance.saveEditTag();
    expect(tagService.updateTag).not.toHaveBeenCalled();
  });

  it('saveEditTag does nothing when the new name is whitespace', async () => {
    const { fixture, tagService } = await renderProfile();
    fixture.componentInstance.editingTag.set(makeTag({ id: 5 }));
    fixture.componentInstance.editTagName = '   ';
    fixture.componentInstance.saveEditTag();
    expect(tagService.updateTag).not.toHaveBeenCalled();
  });

  it('saveEditTag updates the tag, clears the editing state and reloads', async () => {
    const { fixture, tagService, notification } = await renderProfile();
    tagService.getTags.mockClear();

    fixture.componentInstance.editingTag.set(makeTag({ id: 5 }));
    fixture.componentInstance.editTagName = '  Renamed  ';
    fixture.componentInstance.editTagColor = '#123456';
    fixture.componentInstance.saveEditTag();

    expect(tagService.updateTag).toHaveBeenCalledWith(5, { name: 'Renamed', color: '#123456' });
    expect(notification.success).toHaveBeenCalledWith('Tag updated');
    expect(fixture.componentInstance.editingTag()).toBeNull();
    expect(tagService.getTags).toHaveBeenCalledTimes(1);
  });

  it('cancelEditTag clears the editing tag', async () => {
    const { fixture } = await renderProfile();
    fixture.componentInstance.editingTag.set(makeTag({ id: 5 }));
    fixture.componentInstance.cancelEditTag();
    expect(fixture.componentInstance.editingTag()).toBeNull();
  });

  it('confirmDeleteTag opens the dialog and deletes when confirmed', async () => {
    const { fixture, dialog, tagService, notification } = await renderProfile({
      dialogResult: true,
    });
    tagService.getTags.mockClear();

    fixture.componentInstance.confirmDeleteTag(makeTag({ id: 9, name: 'VIP' }));

    expect(dialog.open).toHaveBeenCalled();
    expect(tagService.deleteTag).toHaveBeenCalledWith(9);
    expect(notification.success).toHaveBeenCalledWith('Tag deleted');
    expect(tagService.getTags).toHaveBeenCalledTimes(1);
  });

  it('confirmDeleteTag does nothing when the user cancels', async () => {
    const { fixture, tagService, notification } = await renderProfile({ dialogResult: false });
    tagService.getTags.mockClear();

    fixture.componentInstance.confirmDeleteTag(makeTag({ id: 9 }));

    expect(tagService.deleteTag).not.toHaveBeenCalled();
    expect(notification.success).not.toHaveBeenCalled();
    expect(tagService.getTags).not.toHaveBeenCalled();
  });

  it('shows the empty tag placeholder when there are no tags', async () => {
    const stubs = makeStubs();
    stubs.tagService.getTags.mockReturnValue(of([]));

    await renderWithProviders(ProfileComponent, {
      providers: [
        { provide: AuthService, useValue: stubs.authService },
        { provide: TagService, useValue: stubs.tagService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    expect(await screen.findByText('No tags created yet.')).toBeInTheDocument();
  });

  it('renders the inline edit form when a tag is being edited', async () => {
    const { fixture } = await renderProfile();
    fixture.componentInstance.startEditTag(makeTag({ id: 1 }));
    fixture.detectChanges();

    const icons = fixture.nativeElement.querySelectorAll('mat-icon');
    const checkIcon = Array.from(icons).find(
      (el) => (el as HTMLElement).textContent?.trim() === 'check',
    );
    expect(checkIcon).toBeTruthy();
  });

  it('starts editing a tag when the row edit button is clicked via DOM', async () => {
    const { fixture } = await renderProfile();

    const icons = fixture.nativeElement.querySelectorAll('mat-icon');
    const editIcon = Array.from(icons).find(
      (el) => (el as HTMLElement).textContent?.trim() === 'edit',
    ) as HTMLElement | undefined;
    const editBtn = editIcon?.closest('button') as HTMLButtonElement;
    editBtn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.editingTag()).not.toBeNull();
  });

  it('opens the confirm dialog when the row delete button is clicked via DOM', async () => {
    const { fixture, dialog } = await renderProfile({ dialogResult: false });

    const icons = fixture.nativeElement.querySelectorAll('mat-icon');
    const deleteIcon = Array.from(icons).find(
      (el) => (el as HTMLElement).textContent?.trim() === 'delete',
    ) as HTMLElement | undefined;
    const deleteBtn = deleteIcon?.closest('button') as HTMLButtonElement;
    deleteBtn.click();

    expect(dialog.open).toHaveBeenCalled();
  });

  it('updates newTagName via the input ngModel', async () => {
    const { fixture } = await renderProfile();
    const input = fixture.nativeElement.querySelector(
      'input[placeholder="e.g. VIP"]',
    ) as HTMLInputElement;
    input.value = 'Hot';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.newTagName).toBe('Hot');
  });

  it('updates newTagColor via the color input ngModel', async () => {
    const { fixture } = await renderProfile();
    const input = fixture.nativeElement.querySelector(
      'input[type="color"]',
    ) as HTMLInputElement;
    input.value = '#abcdef';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.newTagColor).toBe('#abcdef');
  });

  it('triggers createTag when the Add Tag button is clicked via DOM', async () => {
    const { fixture, tagService } = await renderProfile();
    fixture.componentInstance.newTagName = 'Click';
    fixture.detectChanges();

    const addBtn = screen.getByRole('button', { name: /Add Tag/i });
    addBtn.click();
    fixture.detectChanges();

    expect(tagService.createTag).toHaveBeenCalled();
  });

  it('triggers saveEditTag when the inline check button is clicked via DOM', async () => {
    const { fixture, tagService } = await renderProfile();
    fixture.componentInstance.startEditTag(makeTag({ id: 1, name: 'Old' }));
    fixture.componentInstance.editTagName = 'New';
    fixture.detectChanges();

    const inlineForm = fixture.nativeElement.querySelector('.tag-form--inline') as HTMLElement;
    const icons = inlineForm.querySelectorAll('mat-icon');
    const checkIcon = Array.from(icons).find(
      (el) => (el as HTMLElement).textContent?.trim() === 'check',
    ) as HTMLElement | undefined;
    const checkBtn = checkIcon?.closest('button') as HTMLButtonElement;
    checkBtn.click();
    fixture.detectChanges();

    expect(tagService.updateTag).toHaveBeenCalled();
  });

  it('triggers cancelEditTag when the inline close button is clicked via DOM', async () => {
    const { fixture } = await renderProfile();
    fixture.componentInstance.startEditTag(makeTag({ id: 1 }));
    fixture.detectChanges();

    const inlineForm = fixture.nativeElement.querySelector('.tag-form--inline') as HTMLElement;
    const icons = inlineForm.querySelectorAll('mat-icon');
    const closeIcon = Array.from(icons).find(
      (el) => (el as HTMLElement).textContent?.trim() === 'close',
    ) as HTMLElement | undefined;
    const closeBtn = closeIcon?.closest('button') as HTMLButtonElement;
    closeBtn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.editingTag()).toBeNull();
  });

  it('updates editTagName and editTagColor via the inline edit ngModels', async () => {
    const { fixture } = await renderProfile();
    fixture.componentInstance.startEditTag(makeTag({ id: 1 }));
    fixture.detectChanges();

    const inlineForm = fixture.nativeElement.querySelector(
      '.tag-form--inline',
    ) as HTMLElement;
    const textInput = inlineForm.querySelector('input[matInput]') as HTMLInputElement;
    textInput.value = 'Renamed';
    textInput.dispatchEvent(new Event('input', { bubbles: true }));

    const colorInput = inlineForm.querySelector(
      'input[type="color"]',
    ) as HTMLInputElement;
    colorInput.value = '#112233';
    colorInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.editTagName).toBe('Renamed');
    expect(fixture.componentInstance.editTagColor).toBe('#112233');
  });
});
