import { Component, input, computed } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { DealStageCount } from '@core/models/dashboard.model';

const STAGE_COLORS: Record<string, string> = {
  Lead: '#F4C95D',
  Qualified: '#F9A66C',
  Proposal: '#F76C6C',
  Negotiation: '#3B82F6',
  Won: '#02795F',
  Lost: '#9CA3AF',
};

@Component({
  selector: 'app-pipeline-chart',
  standalone: true,
  imports: [BaseChartDirective],
  template: `
    <div class="pipeline-chart sr-card">
      <h3 class="pipeline-chart__title">Pipeline by Stage</h3>
      <canvas baseChart [data]="chartData()" [options]="chartOptions" type="bar"></canvas>
    </div>
  `,
  styles: `
    .pipeline-chart {
      padding: 20px;

      &__title {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 16px;
        color: var(--sr-text);
      }
    }
  `,
})
export class PipelineChartComponent {
  stages = input.required<DealStageCount[]>();

  chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const data = this.stages();
    return {
      labels: data.map((s) => s.stage),
      datasets: [
        {
          label: 'Value',
          data: data.map((s) => s.totalValue),
          backgroundColor: data.map((s) => STAGE_COLORS[s.stage] ?? '#9CA3AF'),
          borderRadius: 6,
          barThickness: 32,
        },
      ],
    };
  });

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `$${((ctx.parsed.y ?? 0) / 1000).toFixed(0)}K`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (val) => `$${(Number(val) / 1000).toFixed(0)}K`,
        },
        grid: { color: '#f3f4f6' },
      },
      x: {
        grid: { display: false },
      },
    },
  };
}
