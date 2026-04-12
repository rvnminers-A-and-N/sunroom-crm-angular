import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/angular';
import { DealPipelineComponent } from './deal-pipeline.component';
import { DealService } from '../services/deal.service';
import { NotificationService } from '@core/services/notification.service';
import { renderWithProviders } from '../../../../testing/render';
import { makePipeline, makeDeal, makePipelineStage } from '../../../../testing/fixtures';
import type { Deal, PipelineStage } from '@core/models/deal.model';

interface DealServiceStub {
  getPipeline: ReturnType<typeof vi.fn>;
  updateDeal: ReturnType<typeof vi.fn>;
}

interface NotificationStub {
  error: ReturnType<typeof vi.fn>;
}

interface DialogStub {
  open: ReturnType<typeof vi.fn>;
}

function makeStubs() {
  const dialogRef = {
    afterClosed: vi.fn().mockReturnValue(of(undefined)),
  } as unknown as MatDialogRef<unknown>;

  const dealService: DealServiceStub = {
    getPipeline: vi.fn().mockReturnValue(of(makePipeline())),
    updateDeal: vi.fn().mockReturnValue(of(makeDeal({ id: 1 }))),
  };
  const notification: NotificationStub = { error: vi.fn() };
  const dialog: DialogStub = { open: vi.fn().mockReturnValue(dialogRef) };

  return { dealService, notification, dialog, dialogRef };
}

async function renderPipeline(overrides?: { dialogResult?: unknown }) {
  const stubs = makeStubs();
  if (overrides?.dialogResult !== undefined) {
    (stubs.dialogRef.afterClosed as ReturnType<typeof vi.fn>).mockReturnValue(of(overrides.dialogResult));
  }
  const result = await renderWithProviders(DealPipelineComponent, {
    routes: [{ path: 'deals', children: [] }, { path: 'deals/pipeline', children: [] }],
    providers: [
      { provide: DealService, useValue: stubs.dealService },
      { provide: NotificationService, useValue: stubs.notification },
      { provide: MatDialog, useValue: stubs.dialog },
    ],
  });
  return { ...result, ...stubs };
}

function makeDropEvent(opts: {
  prevContainerId: string;
  containerId: string;
  prevIndex: number;
  currentIndex: number;
  deal: Deal;
}): CdkDragDrop<Deal[]> {
  return {
    previousContainer: { id: opts.prevContainerId } as unknown as CdkDragDrop<Deal[]>['previousContainer'],
    container: { id: opts.containerId } as unknown as CdkDragDrop<Deal[]>['container'],
    previousIndex: opts.prevIndex,
    currentIndex: opts.currentIndex,
    item: { data: opts.deal } as unknown as CdkDragDrop<Deal[]>['item'],
  } as CdkDragDrop<Deal[]>;
}

describe('DealPipelineComponent', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('loads and renders the pipeline stages on init', async () => {
    const { fixture } = await renderPipeline();
    expect(fixture.componentInstance.stages().length).toBeGreaterThan(0);
    expect(screen.getAllByText('Lead').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Qualified').length).toBeGreaterThan(0);
  });

  it('clears loading on getPipeline error', async () => {
    const stubs = makeStubs();
    stubs.dealService.getPipeline.mockReturnValueOnce(throwError(() => new Error('boom')));

    const { fixture } = await renderWithProviders(DealPipelineComponent, {
      routes: [{ path: 'deals', children: [] }, { path: 'deals/pipeline', children: [] }],
      providers: [
        { provide: DealService, useValue: stubs.dealService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('getStageColor returns the configured color for known stages', async () => {
    const { fixture } = await renderPipeline();
    expect(fixture.componentInstance.getStageColor('Lead')).toBe('#2563eb');
    expect(fixture.componentInstance.getStageColor('Won')).toBe('#02795f');
  });

  it('getStageColor falls back to grey for unknown stages', async () => {
    const { fixture } = await renderPipeline();
    expect(fixture.componentInstance.getStageColor('Unknown')).toBe('#6b7280');
  });

  it('getConnectedLists returns drop list ids prefixed with stage-', async () => {
    const { fixture } = await renderPipeline();
    const lists = fixture.componentInstance.getConnectedLists();
    expect(lists).toContain('stage-Lead');
    expect(lists).toContain('stage-Qualified');
  });

  describe('onDrop', () => {
    it('returns early when dropped at the same position in the same container', async () => {
      const { fixture, dealService } = await renderPipeline();
      dealService.updateDeal.mockClear();

      const sameContainer = { id: 'stage-Lead' } as unknown as CdkDragDrop<Deal[]>['container'];
      const event = {
        previousContainer: sameContainer,
        container: sameContainer,
        previousIndex: 0,
        currentIndex: 0,
        item: { data: makeDeal({ id: 1, stage: 'Lead' }) } as unknown as CdkDragDrop<Deal[]>['item'],
      } as CdkDragDrop<Deal[]>;

      const targetStage: PipelineStage = makePipelineStage({ stage: 'Lead' });
      fixture.componentInstance.onDrop(event, targetStage);

      expect(dealService.updateDeal).not.toHaveBeenCalled();
    });

    it('moves the deal between stages and persists the change', async () => {
      const { fixture, dealService } = await renderPipeline();

      // Set up a deterministic stages snapshot
      fixture.componentInstance.stages.set([
        makePipelineStage({
          stage: 'Lead',
          count: 1,
          totalValue: 10_000,
          deals: [makeDeal({ id: 1, stage: 'Lead', value: 10_000 })],
        }),
        makePipelineStage({
          stage: 'Qualified',
          count: 0,
          totalValue: 0,
          deals: [],
        }),
      ]);

      dealService.updateDeal.mockClear();

      const deal = makeDeal({ id: 1, stage: 'Lead', value: 10_000 });
      const event = makeDropEvent({
        prevContainerId: 'stage-Lead',
        containerId: 'stage-Qualified',
        prevIndex: 0,
        currentIndex: 0,
        deal,
      });

      const targetStage = fixture.componentInstance.stages()[1];
      fixture.componentInstance.onDrop(event, targetStage);

      const stages = fixture.componentInstance.stages();
      expect(stages[0].deals).toHaveLength(0);
      expect(stages[0].count).toBe(0);
      expect(stages[0].totalValue).toBe(0);
      expect(stages[1].deals).toHaveLength(1);
      expect(stages[1].count).toBe(1);
      expect(stages[1].totalValue).toBe(10_000);
      expect(stages[1].deals[0].stage).toBe('Qualified');

      expect(dealService.updateDeal).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ stage: 'Qualified' }),
      );
    });

    it('reloads the pipeline and notifies on update error', async () => {
      const { fixture, dealService, notification } = await renderPipeline();

      dealService.updateDeal.mockReturnValueOnce(throwError(() => new Error('nope')));
      const reloadSpy = vi.spyOn(fixture.componentInstance, 'loadPipeline');

      fixture.componentInstance.stages.set([
        makePipelineStage({
          stage: 'Lead',
          count: 1,
          deals: [makeDeal({ id: 1, stage: 'Lead', value: 5_000 })],
        }),
        makePipelineStage({ stage: 'Qualified', count: 0, deals: [] }),
      ]);

      const deal = makeDeal({ id: 1, stage: 'Lead', value: 5_000 });
      const event = makeDropEvent({
        prevContainerId: 'stage-Lead',
        containerId: 'stage-Qualified',
        prevIndex: 0,
        currentIndex: 0,
        deal,
      });

      fixture.componentInstance.onDrop(event, fixture.componentInstance.stages()[1]);

      expect(notification.error).toHaveBeenCalledWith('Failed to update deal stage');
      expect(reloadSpy).toHaveBeenCalled();
    });

    it('handles missing source and target stages without throwing', async () => {
      const { fixture, dealService } = await renderPipeline();

      fixture.componentInstance.stages.set([
        makePipelineStage({ stage: 'Lead', deals: [] }),
      ]);

      const deal = makeDeal({ id: 99, stage: 'Lead', value: 1_000 });
      const event = makeDropEvent({
        prevContainerId: 'stage-Missing',
        containerId: 'stage-AlsoMissing',
        prevIndex: 0,
        currentIndex: 0,
        deal,
      });

      expect(() =>
        fixture.componentInstance.onDrop(event, makePipelineStage({ stage: 'AlsoMissing' })),
      ).not.toThrow();

      // updateDeal should still be invoked since the function only returns early
      // when source/target containers and index match.
      expect(dealService.updateDeal).toHaveBeenCalled();
    });

    it('persists the change with companyId and expectedCloseDate omitted when null', async () => {
      const { fixture, dealService } = await renderPipeline();
      dealService.updateDeal.mockClear();

      fixture.componentInstance.stages.set([
        makePipelineStage({
          stage: 'Lead',
          count: 1,
          deals: [makeDeal({ id: 1, stage: 'Lead', value: 1000, companyId: null, expectedCloseDate: null })],
        }),
        makePipelineStage({ stage: 'Qualified', count: 0, deals: [] }),
      ]);

      const deal = makeDeal({
        id: 1,
        stage: 'Lead',
        value: 1000,
        companyId: null,
        expectedCloseDate: null,
      });
      const event = makeDropEvent({
        prevContainerId: 'stage-Lead',
        containerId: 'stage-Qualified',
        prevIndex: 0,
        currentIndex: 0,
        deal,
      });

      fixture.componentInstance.onDrop(event, fixture.componentInstance.stages()[1]);

      expect(dealService.updateDeal).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          companyId: undefined,
          expectedCloseDate: undefined,
        }),
      );
    });

    it('handles a missing deal id in the source stage gracefully', async () => {
      const { fixture } = await renderPipeline();

      fixture.componentInstance.stages.set([
        makePipelineStage({
          stage: 'Lead',
          count: 1,
          deals: [makeDeal({ id: 2, stage: 'Lead', value: 1_000 })],
        }),
        makePipelineStage({ stage: 'Qualified', count: 0, deals: [] }),
      ]);

      const deal = makeDeal({ id: 99, stage: 'Lead', value: 5_000 });
      const event = makeDropEvent({
        prevContainerId: 'stage-Lead',
        containerId: 'stage-Qualified',
        prevIndex: 0,
        currentIndex: 0,
        deal,
      });

      expect(() =>
        fixture.componentInstance.onDrop(event, fixture.componentInstance.stages()[1]),
      ).not.toThrow();
    });
  });

  it('opens the create dialog and reloads when it returns truthy', async () => {
    const { fixture, dialog, dealService } = await renderPipeline({ dialogResult: true });
    dealService.getPipeline.mockClear();

    fixture.componentInstance.openCreateDialog();

    expect(dialog.open).toHaveBeenCalled();
    expect(dealService.getPipeline).toHaveBeenCalled();
  });

  it('does not reload after the create dialog is dismissed', async () => {
    const { fixture, dialog, dealService } = await renderPipeline({ dialogResult: false });
    dealService.getPipeline.mockClear();

    fixture.componentInstance.openCreateDialog();

    expect(dialog.open).toHaveBeenCalled();
    expect(dealService.getPipeline).not.toHaveBeenCalled();
  });

  it('opens the create dialog when the page header Add Deal is clicked', async () => {
    const { dialog } = await renderPipeline({ dialogResult: false });
    const addBtn = screen.getByRole('button', { name: /Add Deal/i });
    await userEvent.click(addBtn);
    expect(dialog.open).toHaveBeenCalled();
  });

  it('invokes onDrop when a CdkDropList emits a drop event via its output', async () => {
    const { fixture, dealService } = await renderPipeline();
    dealService.updateDeal.mockClear();

    const dropList = fixture.debugElement.query(By.directive(CdkDropList))
      .injector.get(CdkDropList);

    const sameContainer = { id: 'stage-Lead' } as unknown as CdkDragDrop<unknown>['container'];
    dropList.dropped.emit({
      previousContainer: sameContainer,
      container: sameContainer,
      previousIndex: 0,
      currentIndex: 0,
      item: { data: makeDeal({ id: 1 }) },
    } as unknown as CdkDragDrop<unknown>);

    // Same-position drop returns early so updateDeal should not be called.
    expect(dealService.updateDeal).not.toHaveBeenCalled();
  });

  it('renders the empty placeholder for stages with no deals', async () => {
    const stubs = makeStubs();
    stubs.dealService.getPipeline.mockReturnValue(
      of({
        stages: [
          makePipelineStage({ stage: 'Lead', count: 0, deals: [] }),
        ],
      }),
    );

    await renderWithProviders(DealPipelineComponent, {
      routes: [{ path: 'deals', children: [] }, { path: 'deals/pipeline', children: [] }],
      providers: [
        { provide: DealService, useValue: stubs.dealService },
        { provide: NotificationService, useValue: stubs.notification },
        { provide: MatDialog, useValue: stubs.dialog },
      ],
    });

    expect(await screen.findByText('No deals')).toBeInTheDocument();
  });
});
