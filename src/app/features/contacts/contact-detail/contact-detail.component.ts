import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { ContactService } from '../services/contact.service';
import { NotificationService } from '@core/services/notification.service';
import { ContactDetail } from '@core/models/contact.model';
import { TagChipComponent } from '@shared/components/tag-chip/tag-chip.component';
import { ActivityIconComponent } from '@shared/components/activity-icon/activity-icon.component';
import { RelativeTimePipe } from '@shared/pipes/relative-time.pipe';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ContactFormDialogComponent } from '../contact-form-dialog/contact-form-dialog.component';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    TagChipComponent,
    ActivityIconComponent,
    RelativeTimePipe,
  ],
  templateUrl: './contact-detail.component.html',
  styleUrl: './contact-detail.component.scss',
})
export class ContactDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contactService = inject(ContactService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  contact = signal<ContactDetail | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadContact(id);
  }

  private loadContact(id: number): void {
    this.contactService.getContact(id).subscribe({
      next: (c) => {
        this.contact.set(c);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/contacts']);
      },
    });
  }

  openEditDialog(): void {
    const c = this.contact();
    if (!c) return;
    const ref = this.dialog.open(ContactFormDialogComponent, {
      width: '500px',
      data: c,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadContact(c.id);
    });
  }

  confirmDelete(): void {
    const c = this.contact();
    if (!c) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Contact',
        message: `Are you sure you want to delete ${c.firstName} ${c.lastName}?`,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.contactService.deleteContact(c.id).subscribe(() => {
          this.notification.success('Contact deleted');
          this.router.navigate(['/contacts']);
        });
      }
    });
  }
}
