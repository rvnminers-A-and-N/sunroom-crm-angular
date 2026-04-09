import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ToolbarComponent } from './toolbar/toolbar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, ToolbarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private routerSub?: Subscription;

  sidebarCollapsed = signal(window.innerWidth <= 768);

  ngOnInit(): void {
    // Auto-collapse sidebar on mobile navigation
    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        if (window.innerWidth <= 768) {
          this.sidebarCollapsed.set(true);
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }
}
