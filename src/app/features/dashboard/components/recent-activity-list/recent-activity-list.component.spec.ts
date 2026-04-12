import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/angular';
import { RecentActivityListComponent } from './recent-activity-list.component';
import { renderWithProviders } from '../../../../../testing/render';
import type { RecentActivity } from '@core/models/dashboard.model';

const ISO = '2025-01-01T00:00:00.000Z';

function makeRecent(overrides: Partial<RecentActivity> = {}): RecentActivity {
  return {
    id: 1,
    type: 'Note',
    subject: 'Followed up',
    contactName: 'Ada Lovelace',
    userName: 'Test User',
    occurredAt: ISO,
    ...overrides,
  };
}

describe('RecentActivityListComponent', () => {
  it('renders an item per activity with the contact name when present', async () => {
    await renderWithProviders(RecentActivityListComponent, {
      componentInputs: {
        activities: [
          makeRecent({ id: 1, subject: 'Note one' }),
          makeRecent({ id: 2, subject: 'Note two', contactName: null }),
        ],
      },
    });

    expect(screen.getByText('Note one')).toBeInTheDocument();
    expect(screen.getByText('Note two')).toBeInTheDocument();
    expect(screen.getByText(/Ada Lovelace/)).toBeInTheDocument();
  });

  it('omits the contact name when it is null', async () => {
    const { fixture } = await renderWithProviders(RecentActivityListComponent, {
      componentInputs: {
        activities: [makeRecent({ id: 1, contactName: null })],
      },
    });

    expect(fixture.nativeElement.textContent).not.toContain('·');
  });

  it('shows the empty placeholder when there are no activities', async () => {
    await renderWithProviders(RecentActivityListComponent, {
      componentInputs: { activities: [] },
    });

    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });
});
