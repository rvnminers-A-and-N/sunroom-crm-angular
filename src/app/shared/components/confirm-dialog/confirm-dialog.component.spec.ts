import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../testing/render';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let close: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    close = vi.fn();
  });

  async function renderDialog(data: ConfirmDialogData) {
    return renderWithProviders(ConfirmDialogComponent, {
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close } },
      ],
    });
  }

  it('renders the title and message and the default action labels', async () => {
    await renderDialog({ title: 'Confirm', message: 'Are you sure?' });

    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('renders custom action labels when provided', async () => {
    await renderDialog({
      title: 'Heads up',
      message: 'Proceed?',
      confirmText: 'Yes please',
      cancelText: 'Nope',
    });

    expect(screen.getByRole('button', { name: 'Yes please' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nope' })).toBeInTheDocument();
  });

  it('closes with false when the cancel button is clicked', async () => {
    await renderDialog({ title: 't', message: 'm' });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(close).toHaveBeenCalledWith(false);
  });

  it('closes with true when the confirm button is clicked', async () => {
    await renderDialog({ title: 't', message: 'm' });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(close).toHaveBeenCalledWith(true);
  });
});
