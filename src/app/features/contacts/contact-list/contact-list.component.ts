import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ContactService } from '../services/contact.service';
import { TagService } from '@core/services/tag.service';
import { NotificationService } from '@core/services/notification.service';
import { Contact } from '@core/models/contact.model';
import { Tag } from '@core/models/tag.model';
import { PaginationMeta } from '@core/models/pagination.model';
import { TagChipComponent } from '@shared/components/tag-chip/tag-chip.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ContactFormDialogComponent } from '../contact-form-dialog/contact-form-dialog.component';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    TagChipComponent,
    PageHeaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './contact-list.component.html',
  styleUrl: './contact-list.component.scss',
})
export class ContactListComponent implements OnInit {
  private contactService = inject(ContactService);
  private tagService = inject(TagService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  contacts = signal<Contact[]>([]);
  tags = signal<Tag[]>([]);
  meta = signal<PaginationMeta>({ currentPage: 1, perPage: 10, total: 0, lastPage: 1 });
  loading = signal(true);

  search = '';
  selectedTagId: number | null = null;
  displayedColumns = ['name', 'email', 'phone', 'company', 'tags', 'actions'];

  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.loadContacts();
    this.tagService.getTags().subscribe((tags) => this.tags.set(tags));
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.meta.update((m) => ({ ...m, currentPage: 1 }));
      this.loadContacts();
    });
  }

  loadContacts(): void {
    this.loading.set(true);
    const m = this.meta();
    this.contactService
      .getContacts({
        page: m.currentPage,
        perPage: m.perPage,
        search: this.search || undefined,
        tagId: this.selectedTagId ?? undefined,
      })
      .subscribe({
        next: (res) => {
          this.contacts.set(res.data);
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

  onTagFilter(tagId: number | null): void {
    this.selectedTagId = tagId;
    this.meta.update((m) => ({ ...m, currentPage: 1 }));
    this.loadContacts();
  }

  onPage(event: PageEvent): void {
    this.meta.update((m) => ({
      ...m,
      currentPage: event.pageIndex + 1,
      perPage: event.pageSize,
    }));
    this.loadContacts();
  }

  onRowClick(contact: Contact): void {
    this.router.navigate(['/contacts', contact.id]);
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(ContactFormDialogComponent, {
      width: '500px',
      data: null,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadContacts();
    });
  }

  openEditDialog(contact: Contact, event: MouseEvent): void {
    event.stopPropagation();
    const ref = this.dialog.open(ContactFormDialogComponent, {
      width: '500px',
      data: contact,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadContacts();
    });
  }

  confirmDelete(contact: Contact, event: MouseEvent): void {
    event.stopPropagation();
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Contact',
        message: `Are you sure you want to delete ${contact.firstName} ${contact.lastName}?`,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.contactService.deleteContact(contact.id).subscribe(() => {
          this.notification.success('Contact deleted');
          this.loadContacts();
        });
      }
    });
  }
}
