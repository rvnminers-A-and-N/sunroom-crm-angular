import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NEVER, of, throwError } from 'rxjs';
import { screen } from '@testing-library/angular';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from './services/dashboard.service';
import { renderWithProviders } from '../../../testing/render';
import { makeDashboard } from '../../../testing/fixtures';

interface DashboardServiceStub {
  getDashboard: ReturnType<typeof vi.fn>;
}

function makeStubs(): { dashboardService: DashboardServiceStub } {
  return {
    dashboardService: {
      getDashboard: vi.fn().mockReturnValue(of(makeDashboard())),
    },
  };
}

async function renderDashboard(stubs = makeStubs()) {
  const result = await renderWithProviders(DashboardComponent, {
    routes: [
      { path: 'contacts', children: [] },
      { path: 'companies', children: [] },
      { path: 'deals', children: [] },
    ],
    providers: [
      provideCharts(withDefaultRegisterables()),
      { provide: DashboardService, useValue: stubs.dashboardService },
    ],
  });
  return { ...result, ...stubs };
}

describe('DashboardComponent', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('loads the dashboard data on init and renders the stat cards', async () => {
    const { fixture, dashboardService } = await renderDashboard();

    expect(dashboardService.getDashboard).toHaveBeenCalled();
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.data()).not.toBeNull();

    expect(await screen.findByText('Total Contacts')).toBeInTheDocument();
    expect(screen.getByText('Total Companies')).toBeInTheDocument();
    expect(screen.getByText('Active Deals')).toBeInTheDocument();
    expect(screen.getByText('Pipeline Value')).toBeInTheDocument();
    expect(screen.getByText('Won Revenue')).toBeInTheDocument();
  });

  it('renders the loading state while data is null and loading is true', async () => {
    const stubs = makeStubs();
    stubs.dashboardService.getDashboard.mockReturnValue(NEVER);

    const { fixture } = await renderDashboard(stubs);

    expect(fixture.componentInstance.loading()).toBe(true);
    expect(fixture.componentInstance.data()).toBeNull();
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('clears the loading flag when the dashboard request errors', async () => {
    const stubs = makeStubs();
    stubs.dashboardService.getDashboard.mockReturnValue(throwError(() => new Error('boom')));

    const { fixture } = await renderDashboard(stubs);

    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.data()).toBeNull();
  });
});
