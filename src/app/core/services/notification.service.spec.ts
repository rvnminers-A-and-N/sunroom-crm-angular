import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let snackBarOpen: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    snackBarOpen = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MatSnackBar, useValue: { open: snackBarOpen } },
      ],
    });
    service = TestBed.inject(NotificationService);
  });

  it('opens a success snackbar with the success panel class', () => {
    service.success('Saved');

    expect(snackBarOpen).toHaveBeenCalledWith('Saved', 'Close', {
      duration: 3000,
      panelClass: 'snackbar-success',
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  });

  it('opens an error snackbar with the error panel class and a longer duration', () => {
    service.error('Boom');

    expect(snackBarOpen).toHaveBeenCalledWith('Boom', 'Close', {
      duration: 5000,
      panelClass: 'snackbar-error',
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  });

  it('opens an info snackbar without a panel class', () => {
    service.info('FYI');

    expect(snackBarOpen).toHaveBeenCalledWith('FYI', 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  });
});
