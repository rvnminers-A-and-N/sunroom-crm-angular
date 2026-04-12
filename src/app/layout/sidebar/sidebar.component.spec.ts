import { BehaviorSubject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../testing/render';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { makeUser } from '../../../testing/fixtures';
import type { User } from '../../core/models/user.model';

describe('SidebarComponent', () => {
  let logout: ReturnType<typeof vi.fn>;
  let currentUser$: BehaviorSubject<User | null>;

  beforeEach(() => {
    logout = vi.fn();
    currentUser$ = new BehaviorSubject<User | null>(null);
  });

  async function renderSidebar(opts: { collapsed?: boolean; user?: User | null } = {}) {
    if (opts.user !== undefined) currentUser$.next(opts.user);
    return renderWithProviders(SidebarComponent, {
      inputs: { collapsed: opts.collapsed ?? false },
      providers: [{ provide: AuthService, useValue: { currentUser$, logout } }],
    });
  }

  it('renders the expanded logo text and the collapse chevron when expanded', async () => {
    await renderSidebar({ collapsed: false });

    expect(screen.getByText(/Sunroom/)).toBeInTheDocument();
    expect(screen.getByText('chevron_left')).toBeInTheDocument();
  });

  it('shows the expand chevron when collapsed', async () => {
    await renderSidebar({ collapsed: true });

    expect(screen.getByText('chevron_right')).toBeInTheDocument();
  });

  it('renders all base navigation items but hides the admin Users item when no user is signed in', async () => {
    await renderSidebar({ user: null });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Companies')).toBeInTheDocument();
    expect(screen.getByText('Deals')).toBeInTheDocument();
    expect(screen.getByText('Activities')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('hides the admin Users item when the current user is not an admin', async () => {
    await renderSidebar({ user: makeUser({ role: 'User' }) });

    expect(screen.queryByText('Users')).not.toBeInTheDocument();
  });

  it('shows the admin Users item when the current user has the Admin role', async () => {
    await renderSidebar({ user: makeUser({ role: 'Admin' }) });

    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('renders the user footer with name, role, and initials when expanded with a user', async () => {
    await renderSidebar({
      collapsed: false,
      user: makeUser({ name: 'Ada Lovelace', role: 'Admin' }),
    });

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('hides the expanded user info but still renders the avatar when collapsed with a user', async () => {
    await renderSidebar({
      collapsed: true,
      user: makeUser({ name: 'Ada Lovelace', role: 'Admin' }),
    });

    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
  });

  it('emits the toggle output when the toggle button is clicked', async () => {
    const onToggle = vi.fn();
    await renderWithProviders(SidebarComponent, {
      inputs: { collapsed: false },
      on: { toggle: onToggle },
      providers: [{ provide: AuthService, useValue: { currentUser$, logout } }],
    });

    const user = userEvent.setup();
    const toggleBtn = screen.getByText('chevron_left').closest('button')!;
    await user.click(toggleBtn);

    expect(onToggle).toHaveBeenCalled();
  });

  it('calls authService.logout when the footer logout button is clicked', async () => {
    await renderSidebar({
      collapsed: false,
      user: makeUser({ role: 'Admin' }),
    });

    const user = userEvent.setup();
    const logoutBtn = screen.getByText('logout').closest('button')!;
    await user.click(logoutBtn);

    expect(logout).toHaveBeenCalled();
  });
});
