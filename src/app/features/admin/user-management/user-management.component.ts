import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { UserManagementService } from '../services/user-management.service';
import { NotificationService } from '@core/services/notification.service';
import { User } from '@core/models/user.model';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatTableModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    PageHeaderComponent,
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent implements OnInit {
  private userService = inject(UserManagementService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  users = signal<User[]>([]);
  loading = signal(true);
  displayedColumns = ['name', 'email', 'role', 'createdAt', 'actions'];
  roles = ['User', 'Admin'];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onRoleChange(user: User, role: string): void {
    this.userService.updateUser(user.id, { role }).subscribe({
      next: () => this.notification.success(`${user.name} updated to ${role}`),
      error: () => this.loadUsers(),
    });
  }

  confirmDelete(user: User): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete User',
        message: `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.userService.deleteUser(user.id).subscribe(() => {
          this.notification.success('User deleted');
          this.loadUsers();
        });
      }
    });
  }
}
