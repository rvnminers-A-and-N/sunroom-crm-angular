import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { CompanyService } from '../services/company.service';
import { NotificationService } from '@core/services/notification.service';
import { CompanyDetail } from '@core/models/company.model';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { CompanyFormDialogComponent } from '../company-form-dialog/company-form-dialog.component';

@Component({
  selector: 'app-company-detail',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
  ],
  templateUrl: './company-detail.component.html',
  styleUrl: './company-detail.component.scss',
})
export class CompanyDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private companyService = inject(CompanyService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  company = signal<CompanyDetail | null>(null);
  loading = signal(true);

  contactColumns = ['name', 'email', 'title'];
  dealColumns = ['title', 'value', 'stage'];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCompany(id);
  }

  private loadCompany(id: number): void {
    this.companyService.getCompany(id).subscribe({
      next: (c) => {
        this.company.set(c);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/companies']);
      },
    });
  }

  openEditDialog(): void {
    const c = this.company();
    if (!c) return;
    const ref = this.dialog.open(CompanyFormDialogComponent, { width: '500px', data: c });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadCompany(c.id);
    });
  }

  confirmDelete(): void {
    const c = this.company();
    if (!c) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Company',
        message: `Are you sure you want to delete ${c.name}? This will not delete associated contacts.`,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.companyService.deleteCompany(c.id).subscribe(() => {
          this.notification.success('Company deleted');
          this.router.navigate(['/companies']);
        });
      }
    });
  }
}
