import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../testing/render';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  it('renders the default icon, title, and message and no action button', async () => {
    await renderWithProviders(EmptyStateComponent);

    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('Nothing to show here yet.')).toBeInTheDocument();
    expect(screen.getByText('inbox')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders custom icon, title, and message values', async () => {
    await renderWithProviders(EmptyStateComponent, {
      inputs: {
        icon: 'inventory',
        title: 'Empty inventory',
        message: 'Add a product to get started.',
      },
    });

    expect(screen.getByText('Empty inventory')).toBeInTheDocument();
    expect(screen.getByText('Add a product to get started.')).toBeInTheDocument();
    expect(screen.getByText('inventory')).toBeInTheDocument();
  });

  it('emits actionClick when the action button is clicked', async () => {
    const onActionClick = vi.fn();
    await renderWithProviders(EmptyStateComponent, {
      inputs: {
        actionLabel: 'Add item',
      },
      on: {
        actionClick: onActionClick,
      },
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Add item/i }));

    expect(onActionClick).toHaveBeenCalled();
  });
});
