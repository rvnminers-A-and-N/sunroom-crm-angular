import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/angular';
import { renderWithProviders } from '../../../../testing/render';
import { StatCardComponent } from './stat-card.component';

describe('StatCardComponent', () => {
  it('renders the icon, label, and value', async () => {
    await renderWithProviders(StatCardComponent, {
      inputs: {
        icon: 'people',
        label: 'Contacts',
        value: 42,
      },
    });

    expect(screen.getByText('people')).toBeInTheDocument();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders a string value as-is', async () => {
    await renderWithProviders(StatCardComponent, {
      inputs: {
        icon: 'attach_money',
        label: 'Revenue',
        value: '$10K',
      },
    });

    expect(screen.getByText('$10K')).toBeInTheDocument();
  });

  it('uses the supplied iconBg and iconColor inputs', async () => {
    const result = await renderWithProviders(StatCardComponent, {
      inputs: {
        icon: 'star',
        label: 'Stars',
        value: 5,
        iconBg: 'rgb(255, 0, 0)',
        iconColor: 'rgb(0, 0, 255)',
      },
    });

    const iconWrapper = result.container.querySelector('.stat-card__icon') as HTMLElement;
    const matIcon = result.container.querySelector('mat-icon') as HTMLElement;

    expect(iconWrapper.style.background).toBe('rgb(255, 0, 0)');
    expect(matIcon.style.color).toBe('rgb(0, 0, 255)');
  });
});
