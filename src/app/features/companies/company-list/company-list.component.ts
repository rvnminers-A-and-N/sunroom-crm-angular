import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { CompanyService } from '../services/company.service';
import { NotificationService } from '@core/services/notification.service';
import { Company } from '@core/models/company.model';
import { PaginationMeta } from '@core/models/pagination.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { CompanyFormDialogComponent } from '../company-form-dialog/company-form-dialog.component';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './company-list.component.html',
  styleUrl: './company-list.component.scss',
})
export class CompanyListComponent implements OnInit {
  private companyService = inject(CompanyService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  companies = signal<Company[]>([]);
  meta = signal<PaginationMeta>({ currentPage: 1, perPage: 10, total: 0, lastPage: 1 });
  loading = signal(true);

  search = '';
  displayedColumns = ['name', 'industry', 'location', 'contacts', 'deals', 'actions'];

  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.loadCompanies();
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.meta.update((m) => ({ ...m, currentPage: 1 }));
      this.loadCompanies();
    });
  }

  loadCompanies(): void {
    this.loading.set(true);
    const m = this.meta();
    this.companyService.getCompanies(m.currentPage, m.perPage, this.search || undefined).subscribe({
      next: (res) => {
        this.companies.set(res.data);
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

  onPage(event: PageEvent): void {
    this.meta.update((m) => ({
      ...m,
      currentPage: event.pageIndex + 1,
      perPage: event.pageSize,
    }));
    this.loadCompanies();
  }

  onRowClick(company: Company): void {
    this.router.navigate(['/companies', company.id]);
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(CompanyFormDialogComponent, { width: '500px', data: null });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadCompanies();
    });
  }

  openEditDialog(company: Company, event: MouseEvent): void {
    event.stopPropagation();
    const ref = this.dialog.open(CompanyFormDialogComponent, { width: '500px', data: company });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadCompanies();
    });
  }

  confirmDelete(company: Company, event: MouseEvent): void {
    event.stopPropagation();
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Company',
        message: `Are you sure you want to delete ${company.name}?`,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.companyService.deleteCompany(company.id).subscribe(() => {
          this.notification.success('Company deleted');
          this.loadCompanies();
        });
      }
    });
  }
}
