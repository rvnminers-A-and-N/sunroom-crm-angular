import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService } from './services/dashboard.service';
import { DashboardData } from '@core/models/dashboard.model';
import { StatCardComponent } from '@shared/components/stat-card/stat-card.component';
import { CurrencyShortPipe } from '@shared/pipes/currency-short.pipe';
import { PipelineChartComponent } from './components/pipeline-chart/pipeline-chart.component';
import { RecentActivityListComponent } from './components/recent-activity-list/recent-activity-list.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    StatCardComponent,
    CurrencyShortPipe,
    PipelineChartComponent,
    RecentActivityListComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  data = signal<DashboardData | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
