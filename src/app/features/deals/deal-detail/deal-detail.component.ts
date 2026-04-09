import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDialog } from '@angular/material/dialog';
import { DealService } from '../services/deal.service';
import { NotificationService } from '@core/services/notification.service';
import { DealDetail, DealStage } from '@core/models/deal.model';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { DealFormDialogComponent } from '../deal-form-dialog/deal-form-dialog.component';
import { ActivityIconComponent } from '@shared/components/activity-icon/activity-icon.component';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';

const ALL_STAGES: DealStage[] = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

@Component({
  selector: 'app-deal-detail',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatStepperModule,
    ActivityIconComponent,
    RelativeTimePipe,
  ],
  templateUrl: './deal-detail.component.html',
  styleUrl: './deal-detail.component.scss',
})
export class DealDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dealService = inject(DealService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  deal = signal<DealDetail | null>(null);
  loading = signal(true);

  stages = ALL_STAGES;

  get currentStageIndex(): number {
    const d = this.deal();
    if (!d) return 0;
    const idx = ALL_STAGES.indexOf(d.stage as DealStage);
    return idx >= 0 ? idx : 0;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDeal(id);
  }

  private loadDeal(id: number): void {
    this.dealService.getDeal(id).subscribe({
      next: (d) => {
        this.deal.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/deals']);
      },
    });
  }

  getStageClass(stage: string): string {
    return 'stage-badge stage-badge--' + stage.toLowerCase();
  }

  openEditDialog(): void {
    const d = this.deal();
    if (!d) return;
    const ref = this.dialog.open(DealFormDialogComponent, { width: '500px', data: d });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadDeal(d.id);
    });
  }

  confirmDelete(): void {
    const d = this.deal();
    if (!d) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Deal',
        message: `Are you sure you want to delete "${d.title}"?`,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.dealService.deleteDeal(d.id).subscribe(() => {
          this.notification.success('Deal deleted');
          this.router.navigate(['/deals']);
        });
      }
    });
  }
}
