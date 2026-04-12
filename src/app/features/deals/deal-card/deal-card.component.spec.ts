import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/angular';
import { DealCardComponent } from './deal-card.component';
import { renderWithProviders } from '../../../../testing/render';
import { makeDeal } from '../../../../testing/fixtures';

describe('DealCardComponent', () => {
  it('renders the title, value and contact name', async () => {
    await renderWithProviders(DealCardComponent, {
      componentInputs: {
        deal: makeDeal({
          id: 1,
          title: 'Big Deal',
          value: 25_000,
          contactName: 'Ada Lovelace',
          companyName: 'Acme Inc',
          expectedCloseDate: '2025-12-31T00:00:00.000Z',
        }),
      },
    });

    expect(screen.getByText('Big Deal')).toBeInTheDocument();
    expect(screen.getByText('$25,000')).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Acme Inc')).toBeInTheDocument();
  });

  it('hides the company row when companyName is missing', async () => {
    await renderWithProviders(DealCardComponent, {
      componentInputs: {
        deal: makeDeal({
          id: 1,
          companyName: null,
          expectedCloseDate: null,
        }),
      },
    });

    expect(screen.queryByText('Acme Inc')).not.toBeInTheDocument();
  });

  it('hides the date row when expectedCloseDate is missing', async () => {
    const { fixture } = await renderWithProviders(DealCardComponent, {
      componentInputs: {
        deal: makeDeal({
          id: 1,
          expectedCloseDate: null,
        }),
      },
    });

    expect(fixture.nativeElement.querySelector('.deal-card__date')).toBeNull();
  });
});
