import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/angular';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { PipelineChartComponent } from './pipeline-chart.component';
import { renderWithProviders } from '../../../../../testing/render';
import type { DealStageCount } from '@core/models/dashboard.model';
import type { ChartConfiguration, TooltipItem } from 'chart.js';

const stages: DealStageCount[] = [
  { stage: 'Lead', count: 2, totalValue: 10_000 },
  { stage: 'Qualified', count: 1, totalValue: 5_000 },
  { stage: 'Won', count: 1, totalValue: 75_000 },
  { stage: 'Bogus', count: 0, totalValue: 0 },
];

describe('PipelineChartComponent', () => {
  it('renders the title and computes labels and dataset from the stages input', async () => {
    const { fixture } = await renderWithProviders(PipelineChartComponent, {
      providers: [provideCharts(withDefaultRegisterables())],
      componentInputs: { stages },
    });

    expect(screen.getByText('Pipeline by Stage')).toBeInTheDocument();

    const data = fixture.componentInstance.chartData();
    expect(data.labels).toEqual(['Lead', 'Qualified', 'Won', 'Bogus']);
    expect(data.datasets[0].data).toEqual([10_000, 5_000, 75_000, 0]);
    // Known stages get their colour, the unknown 'Bogus' stage falls back to #9CA3AF.
    expect(data.datasets[0].backgroundColor).toEqual([
      '#F4C95D',
      '#F9A66C',
      '#02795F',
      '#9CA3AF',
    ]);
  });

  it('formats the tooltip and y-axis ticks as currency in thousands', async () => {
    const { fixture } = await renderWithProviders(PipelineChartComponent, {
      providers: [provideCharts(withDefaultRegisterables())],
      componentInputs: { stages },
    });

    const options = fixture.componentInstance
      .chartOptions as ChartConfiguration<'bar'>['options'];

    const tooltipLabel = options!.plugins!.tooltip!.callbacks!.label as (
      ctx: TooltipItem<'bar'>,
    ) => string;
    const labelText = tooltipLabel({ parsed: { y: 12_500 } } as TooltipItem<'bar'>);
    expect(labelText).toBe('$13K');

    // When parsed.y is undefined the label should fall back to $0K.
    const fallback = tooltipLabel({ parsed: { y: undefined } } as unknown as TooltipItem<'bar'>);
    expect(fallback).toBe('$0K');

    const yTick = options!.scales!['y']!.ticks!.callback as (
      val: number | string,
    ) => string;
    expect(yTick.call({} as never, 7500)).toBe('$8K');
  });
});
