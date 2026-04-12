import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/angular';
import { TestBed } from '@angular/core/testing';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../testing/render';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { makeAuthResponse } from '../../../../testing/fixtures';

describe('LoginComponent', () => {
  let login: ReturnType<typeof vi.fn>;
  let routerNavigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    login = vi.fn();
  });

  async function renderLogin() {
    const result = await renderWithProviders(LoginComponent, {
      providers: [{ provide: AuthService, useValue: { login } }],
    });
    routerNavigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true) as ReturnType<typeof vi.fn>;
    return result;
  }

  it('renders the login heading and email/password inputs', async () => {
    await renderLogin();

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('does not call authService.login when the form is empty/invalid', async () => {
    const result = await renderLogin();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(login).not.toHaveBeenCalled();
    expect(result.fixture.componentInstance.loading()).toBe(false);
  });

  it('submits valid credentials, navigates to /dashboard, and calls AuthService.login', async () => {
    login.mockReturnValue(of(makeAuthResponse()));
    const result = await renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'pw12345');
    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(login).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'pw12345' });
    expect(routerNavigate).toHaveBeenCalledWith(['/dashboard']);
    expect(result.fixture.componentInstance.error()).toBe('');
  });

  it('shows the API error message when login fails with a structured error', async () => {
    login.mockReturnValue(
      throwError(() => ({ error: { message: 'Invalid credentials' } })),
    );
    const result = await renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'pw12345');
    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(result.fixture.componentInstance.error()).toBe('Invalid credentials');
    });
    expect(result.fixture.componentInstance.loading()).toBe(false);
    expect(routerNavigate).not.toHaveBeenCalled();
  });

  it('falls back to a default error message when no message is provided', async () => {
    login.mockReturnValue(throwError(() => ({})));
    const result = await renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'pw12345');
    await user.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(result.fixture.componentInstance.error()).toBe('Login failed');
    });
  });

  it('toggles the password visibility when the visibility button is clicked', async () => {
    const result = await renderLogin();
    const user = userEvent.setup();

    expect(result.fixture.componentInstance.hidePassword()).toBe(true);
    expect(screen.getByText('visibility_off')).toBeInTheDocument();

    const visBtn = screen.getByText('visibility_off').closest('button')!;
    await user.click(visBtn);

    expect(result.fixture.componentInstance.hidePassword()).toBe(false);
    expect(screen.getByText('visibility')).toBeInTheDocument();
  });
});
