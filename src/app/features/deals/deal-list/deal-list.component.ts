import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { DealService } from '../services/deal.service';
import { NotificationService } from '@core/services/notification.service';
import { Deal, DealStage } from '@core/models/deal.model';
import { PaginationMeta } from '@core/models/pagination.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { DealFormDialogComponent } from '../deal-form-dialog/deal-form-dialog.component';

@Component({
  selector: 'app-deal-list',
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './deal-list.component.html',
  styleUrl: './deal-list.component.scss',
})
export class DealListComponent implements OnInit {
  private dealService = inject(DealService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  deals = signal<Deal[]>([]);
  meta = signal<PaginationMeta>({ currentPage: 1, perPage: 10, total: 0, lastPage: 1 });
  loading = signal(true);

  search = '';
  selectedStage = '';
  displayedColumns = ['title', 'value', 'stage', 'contact', 'company', 'expectedClose', 'actions'];
  stages: DealStage[] = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.loadDeals();
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.meta.update((m) => ({ ...m, currentPage: 1 }));
      this.loadDeals();
    });
  }

  loadDeals(): void {
    this.loading.set(true);
    const m = this.meta();
    this.dealService
      .getDeals({
        page: m.currentPage,
        perPage: m.perPage,
        search: this.search || undefined,
        stage: this.selectedStage || undefined,
      })
      .subscribe({
        next: (res) => {
          this.deals.set(res.data);
          this.meta.set(res.meta);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onSearch(value: string): void {
    this.search = value;
    this.searchSubject.next(value);
  }

  onStageFilter(stage: string): void {
    this.selectedStage = stage;
    this.meta.update((m) => ({ ...m, currentPage: 1 }));
    this.loadDeals();
  }

  onPage(event: PageEvent): void {
    this.meta.update((m) => ({
      ...m,
      currentPage: event.pageIndex + 1,
      perPage: event.pageSize,
    }));
    this.loadDeals();
  }

  onRowClick(deal: Deal): void {
    this.router.navigate(['/deals', deal.id]);
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(DealFormDialogComponent, {
      width: '500px',
      data: null,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadDeals();
    });
  }

  openEditDialog(deal: Deal, event: MouseEvent): void {
    event.stopPropagation();
    const ref = this.dialog.open(DealFormDialogComponent, {
      width: '500px',
      data: deal,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadDeals();
    });
  }

  confirmDelete(deal: Deal, event: MouseEvent): void {
    event.stopPropagation();
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Deal',
        message: `Are you sure you want to delete "${deal.title}"?`,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.dealService.deleteDeal(deal.id).subscribe(() => {
          this.notification.success('Deal deleted');
          this.loadDeals();
        });
      }
    });
  }

  getStageClass(stage: string): string {
    return 'stage-badge stage-badge--' + stage.toLowerCase();
  }
}
