import { TestBed } from '@angular/core/testing';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { LayoutComponent } from './layout.component';
import { AuthService } from '../core/services/auth.service';
import { renderWithProviders } from '../../testing/render';
import type { User } from '../core/models/user.model';

function setInnerWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    writable: true,
    configurable: true,
  });
}

describe('LayoutComponent', () => {
  let routerEvents: Subject<unknown>;
  let originalInnerWidth: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    routerEvents = new Subject();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: { events: routerEvents.asObservable() },
        },
        {
          provide: AuthService,
          useValue: {
            currentUser$: new BehaviorSubject<User | null>(null),
            logout: vi.fn(),
          },
        },
      ],
    });
  });

  afterEach(() => {
    setInnerWidth(originalInnerWidth);
  });

  function createLayout(): LayoutComponent {
    return TestBed.runInInjectionContext(() => new LayoutComponent());
  }

  it('starts with the sidebar collapsed when the viewport is mobile-sized', () => {
    setInnerWidth(500);

    const layout = createLayout();

    expect(layout.sidebarCollapsed()).toBe(true);
  });

  it('starts with the sidebar expanded when the viewport is desktop-sized', () => {
    setInnerWidth(1200);

    const layout = createLayout();

    expect(layout.sidebarCollapsed()).toBe(false);
  });

  it('collapses the sidebar on NavigationEnd events when the viewport is mobile-sized', () => {
    setInnerWidth(1200);
    const layout = createLayout();
    layout.ngOnInit();

    setInnerWidth(500);
    routerEvents.next(new NavigationEnd(1, '/contacts', '/contacts'));

    expect(layout.sidebarCollapsed()).toBe(true);
  });

  it('does not collapse the sidebar on NavigationEnd events on desktop viewports', () => {
    setInnerWidth(1200);
    const layout = createLayout();
    layout.ngOnInit();

    routerEvents.next(new NavigationEnd(1, '/contacts', '/contacts'));

    expect(layout.sidebarCollapsed()).toBe(false);
  });

  it('ignores router events that are not NavigationEnd', () => {
    setInnerWidth(500);
    const layout = createLayout();
    layout.sidebarCollapsed.set(false);
    layout.ngOnInit();

    routerEvents.next(new NavigationStart(1, '/contacts'));

    expect(layout.sidebarCollapsed()).toBe(false);
  });

  it('toggleSidebar flips the collapsed state', () => {
    setInnerWidth(1200);
    const layout = createLayout();

    expect(layout.sidebarCollapsed()).toBe(false);
    layout.toggleSidebar();
    expect(layout.sidebarCollapsed()).toBe(true);
    layout.toggleSidebar();
    expect(layout.sidebarCollapsed()).toBe(false);
  });

  it('ngOnDestroy unsubscribes from router events after ngOnInit', () => {
    setInnerWidth(1200);
    const layout = createLayout();
    layout.ngOnInit();

    layout.ngOnDestroy();

    setInnerWidth(500);
    routerEvents.next(new NavigationEnd(1, '/contacts', '/contacts'));
    expect(layout.sidebarCollapsed()).toBe(false);
  });

  it('ngOnDestroy is safe when ngOnInit was not called', () => {
    setInnerWidth(1200);
    const layout = createLayout();

    expect(() => layout.ngOnDestroy()).not.toThrow();
  });
});

describe('LayoutComponent rendering', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    setInnerWidth(1200);
  });

  afterEach(() => {
    setInnerWidth(originalInnerWidth);
  });

  async function renderLayout() {
    return renderWithProviders(LayoutComponent, {
      providers: [
        {
          provide: AuthService,
          useValue: {
            currentUser$: new BehaviorSubject<User | null>(null),
            logout: vi.fn(),
          },
        },
      ],
    });
  }

  it('renders the sidebar, toolbar, and main content area', async () => {
    const result = await renderLayout();

    expect(result.container.querySelector('app-sidebar')).not.toBeNull();
    expect(result.container.querySelector('app-toolbar')).not.toBeNull();
    expect(result.container.querySelector('router-outlet')).not.toBeNull();
  });

  it('renders the layout collapsed-state class on the wrapper as the signal toggles', async () => {
    const result = await renderLayout();
    const wrapper = result.container.querySelector('.layout') as HTMLElement;

    expect(wrapper.classList.contains('layout--collapsed')).toBe(false);

    result.fixture.componentInstance.toggleSidebar();
    result.fixture.detectChanges();

    expect(wrapper.classList.contains('layout--collapsed')).toBe(true);
  });

  it('toggles the sidebar when the backdrop is clicked', async () => {
    const result = await renderLayout();
    const backdrop = result.container.querySelector('.sr-backdrop') as HTMLElement;

    expect(result.fixture.componentInstance.sidebarCollapsed()).toBe(false);

    const user = userEvent.setup();
    await user.click(backdrop);

    expect(result.fixture.componentInstance.sidebarCollapsed()).toBe(true);
  });

  it('toggles the sidebar when the toolbar menu button is clicked', async () => {
    const result = await renderLayout();

    expect(result.fixture.componentInstance.sidebarCollapsed()).toBe(false);

    const user = userEvent.setup();
    const menuBtn = screen.getAllByText('menu')[0].closest('button')!;
    await user.click(menuBtn);

    expect(result.fixture.componentInstance.sidebarCollapsed()).toBe(true);
  });

  it('toggles the sidebar when the sidebar emits its toggle output', async () => {
    const result = await renderLayout();

    expect(result.fixture.componentInstance.sidebarCollapsed()).toBe(false);

    const user = userEvent.setup();
    const sidebarToggleBtn = screen.getByText('chevron_left').closest('button')!;
    await user.click(sidebarToggleBtn);

    expect(result.fixture.componentInstance.sidebarCollapsed()).toBe(true);
  });
});
