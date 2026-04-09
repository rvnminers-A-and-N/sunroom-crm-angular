import { Component, inject, signal, OnInit } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { DealService } from '../services/deal.service';
import { NotificationService } from '@core/services/notification.service';
import { Deal, PipelineStage } from '@core/models/deal.model';
import { DealCardComponent } from '../deal-card/deal-card.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { DealFormDialogComponent } from '../deal-form-dialog/deal-form-dialog.component';
import { CurrencyShortPipe } from '@shared/pipes/currency-short.pipe';

const STAGE_COLORS: Record<string, string> = {
  Lead: '#2563eb',
  Qualified: '#16a34a',
  Proposal: '#ca8a04',
  Negotiation: '#ea580c',
  Won: '#02795f',
  Lost: '#dc2626',
};

@Component({
  selector: 'app-deal-pipeline',
  standalone: true,
  imports: [
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    DealCardComponent,
    PageHeaderComponent,
    CurrencyShortPipe,
  ],
  templateUrl: './deal-pipeline.component.html',
  styleUrl: './deal-pipeline.component.scss',
})
export class DealPipelineComponent implements OnInit {
  private dealService = inject(DealService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  stages = signal<PipelineStage[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadPipeline();
  }

  loadPipeline(): void {
    this.loading.set(true);
    this.dealService.getPipeline().subscribe({
      next: (pipeline) => {
        this.stages.set(pipeline.stages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getStageColor(stage: string): string {
    return STAGE_COLORS[stage] ?? '#6b7280';
  }

  getConnectedLists(): string[] {
    return this.stages().map((s) => 'stage-' + s.stage);
  }

  onDrop(event: CdkDragDrop<Deal[]>, targetStage: PipelineStage): void {
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) {
      return;
    }

    const deal: Deal = event.item.data;

    // Optimistic UI update
    const stagesCopy = this.stages().map((s) => ({
      ...s,
      deals: [...s.deals],
    }));

    // Remove from source
    const sourceStage = stagesCopy.find((s) => s.stage === event.previousContainer.id.replace('stage-', ''));
    if (sourceStage) {
      const idx = sourceStage.deals.findIndex((d) => d.id === deal.id);
      if (idx > -1) {
        sourceStage.deals.splice(idx, 1);
        sourceStage.count--;
        sourceStage.totalValue -= deal.value;
      }
    }

    // Add to target
    const target = stagesCopy.find((s) => s.stage === targetStage.stage);
    if (target) {
      target.deals.splice(event.currentIndex, 0, { ...deal, stage: targetStage.stage });
      target.count++;
      target.totalValue += deal.value;
    }

    this.stages.set(stagesCopy);

    // Persist
    this.dealService
      .updateDeal(deal.id, {
        title: deal.title,
        value: deal.value,
        contactId: deal.contactId,
        companyId: deal.companyId ?? undefined,
        stage: targetStage.stage,
        expectedCloseDate: deal.expectedCloseDate ?? undefined,
      })
      .subscribe({
        error: () => {
          this.notification.error('Failed to update deal stage');
          this.loadPipeline();
        },
      });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(DealFormDialogComponent, {
      width: '500px',
      data: null,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadPipeline();
    });
  }
}
