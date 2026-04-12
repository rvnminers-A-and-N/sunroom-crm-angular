import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../testing/render';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  it('renders the title and no subtitle or action button by default', async () => {
    await renderWithProviders(PageHeaderComponent, {
      inputs: { title: 'Contacts' },
    });

    expect(screen.getByRole('heading', { name: 'Contacts', level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders the subtitle when provided', async () => {
    await renderWithProviders(PageHeaderComponent, {
      inputs: { title: 'Contacts', subtitle: 'All your people' },
    });

    expect(screen.getByText('All your people')).toBeInTheDocument();
  });

  it('emits actionClick when the action button is clicked', async () => {
    const onActionClick = vi.fn();
    await renderWithProviders(PageHeaderComponent, {
      inputs: { title: 'Contacts', actionLabel: 'New contact' },
      on: { actionClick: onActionClick },
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /New contact/i }));

    expect(onActionClick).toHaveBeenCalled();
  });
});
