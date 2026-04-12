import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../testing/render';
import { ToolbarComponent } from './toolbar.component';

describe('ToolbarComponent', () => {
  it('renders the menu button', async () => {
    await renderWithProviders(ToolbarComponent);

    expect(screen.getByText('menu')).toBeInTheDocument();
  });

  it('emits menuToggle when the menu button is clicked', async () => {
    const onMenuToggle = vi.fn();
    await renderWithProviders(ToolbarComponent, {
      on: { menuToggle: onMenuToggle },
    });

    const user = userEvent.setup();
    const button = screen.getByText('menu').closest('button')!;
    await user.click(button);

    expect(onMenuToggle).toHaveBeenCalled();
  });
});
