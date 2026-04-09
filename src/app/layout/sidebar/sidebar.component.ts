import { Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '@core/services/auth.service';
import { InitialsPipe } from '@shared/pipes/initials.pipe';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    AsyncPipe,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    InitialsPipe,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private authService = inject(AuthService);

  collapsed = input(false);
  toggle = output<void>();

  currentUser$ = this.authService.currentUser$;

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Contacts', icon: 'people', route: '/contacts' },
    { label: 'Companies', icon: 'business', route: '/companies' },
    { label: 'Deals', icon: 'handshake', route: '/deals' },
    { label: 'Activities', icon: 'event_note', route: '/activities' },
    { label: 'AI Assistant', icon: 'auto_awesome', route: '/ai' },
    { label: 'Settings', icon: 'settings', route: '/settings' },
    { label: 'Users', icon: 'admin_panel_settings', route: '/admin', adminOnly: true },
  ];

  logout(): void {
    this.authService.logout();
  }
}
