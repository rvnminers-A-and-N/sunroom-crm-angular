import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../testing/render';
import { TagChipComponent } from './tag-chip.component';
import { makeTag } from '../../../../testing/fixtures';

describe('TagChipComponent', () => {
  it('renders the tag name and applies the tag color styling', async () => {
    const tag = makeTag({ name: 'VIP', color: '#02795f' });
    const result = await renderWithProviders(TagChipComponent, {
      inputs: { tag },
    });

    expect(screen.getByText('VIP')).toBeInTheDocument();
    const chip = result.container.querySelector('.tag-chip') as HTMLElement;
    expect(chip.style.color).toBe('rgb(2, 121, 95)');
    expect(chip.style.background).toBe('rgba(2, 121, 95, 0.125)');
  });

  it('does not render a remove button when removable is false', async () => {
    await renderWithProviders(TagChipComponent, {
      inputs: { tag: makeTag() },
    });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('emits remove and stops propagation when the remove button is clicked', async () => {
    const onRemove = vi.fn();
    const onContainerClick = vi.fn();
    const tag = makeTag({ name: 'Lead' });

    const result = await renderWithProviders(TagChipComponent, {
      inputs: { tag, removable: true },
      on: { remove: onRemove },
    });

    result.container.addEventListener('click', onContainerClick);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '×' }));

    expect(onRemove).toHaveBeenCalled();
    expect(onContainerClick).not.toHaveBeenCalled();
  });
});
