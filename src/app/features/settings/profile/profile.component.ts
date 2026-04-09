import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '@core/services/auth.service';
import { TagService } from '@core/services/tag.service';
import { NotificationService } from '@core/services/notification.service';
import { User } from '@core/models/user.model';
import { Tag } from '@core/models/tag.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { TagChipComponent } from '@shared/components/tag-chip/tag-chip.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
    TagChipComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private tagService = inject(TagService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  user = signal<User | null>(null);
  tags = signal<Tag[]>([]);

  // Tag form
  newTagName = '';
  newTagColor = '#02795f';
  editingTag = signal<Tag | null>(null);
  editTagName = '';
  editTagColor = '';

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((u) => this.user.set(u));
    if (!this.user()) {
      this.authService.loadCurrentUser().subscribe();
    }
    this.loadTags();
  }

  private loadTags(): void {
    this.tagService.getTags().subscribe((tags) => this.tags.set(tags));
  }

  createTag(): void {
    if (!this.newTagName.trim()) return;
    this.tagService.createTag({ name: this.newTagName.trim(), color: this.newTagColor }).subscribe({
      next: () => {
        this.notification.success('Tag created');
        this.newTagName = '';
        this.newTagColor = '#02795f';
        this.loadTags();
      },
    });
  }

  startEditTag(tag: Tag): void {
    this.editingTag.set(tag);
    this.editTagName = tag.name;
    this.editTagColor = tag.color;
  }

  saveEditTag(): void {
    const tag = this.editingTag();
    if (!tag || !this.editTagName.trim()) return;
    this.tagService.updateTag(tag.id, { name: this.editTagName.trim(), color: this.editTagColor }).subscribe({
      next: () => {
        this.notification.success('Tag updated');
        this.editingTag.set(null);
        this.loadTags();
      },
    });
  }

  cancelEditTag(): void {
    this.editingTag.set(null);
  }

  confirmDeleteTag(tag: Tag): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Tag',
        message: `Are you sure you want to delete the tag "${tag.name}"?`,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.tagService.deleteTag(tag.id).subscribe(() => {
          this.notification.success('Tag deleted');
          this.loadTags();
        });
      }
    });
  }
}
