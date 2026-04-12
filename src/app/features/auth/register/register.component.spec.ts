import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../testing/render';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { makeAuthResponse } from '../../../../testing/fixtures';

describe('RegisterComponent', () => {
  let register: ReturnType<typeof vi.fn>;
  let routerNavigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    register = vi.fn();
  });

  async function renderRegister() {
    const result = await renderWithProviders(RegisterComponent, {
      providers: [{ provide: AuthService, useValue: { register } }],
    });
    routerNavigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true) as ReturnType<typeof vi.fn>;
    return result;
  }

  it('renders the register heading and all four inputs', async () => {
    await renderRegister();

    expect(screen.getByRole('heading', { name: 'Create an account' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
  });

  it('does not call authService.register when the form is empty', async () => {
    const result = await renderRegister();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(register).not.toHaveBeenCalled();
    expect(result.fixture.componentInstance.loading()).toBe(false);
  });

  it('marks the form invalid when the passwords do not match', async () => {
    const result = await renderRegister();
    const form = result.fixture.componentInstance.form;

    form.patchValue({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'pw12345678',
      confirmPassword: 'different!',
    });
    form.markAllAsTouched();
    result.fixture.detectChanges();

    expect(form.invalid).toBe(true);
    expect(form.controls.confirmPassword.hasError('passwordMismatch')).toBe(true);

    result.fixture.componentInstance.onSubmit();
    expect(register).not.toHaveBeenCalled();
  });

  it('submits valid registration data, navigates to /dashboard, and calls AuthService.register', async () => {
    register.mockReturnValue(of(makeAuthResponse()));
    const result = await renderRegister();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Full Name/i), 'Ada Lovelace');
    await user.type(screen.getByLabelText(/^Email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/^Password$/i), 'pw12345678');
    await user.type(screen.getByLabelText(/Confirm Password/i), 'pw12345678');
    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    expect(register).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'pw12345678',
    });
    expect(routerNavigate).toHaveBeenCalledWith(['/dashboard']);
    expect(result.fixture.componentInstance.error()).toBe('');
  });

  it('shows the API error message when registration fails with a structured error', async () => {
    register.mockReturnValue(
      throwError(() => ({ error: { message: 'Email already taken' } })),
    );
    const result = await renderRegister();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Full Name/i), 'Ada Lovelace');
    await user.type(screen.getByLabelText(/^Email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/^Password$/i), 'pw12345678');
    await user.type(screen.getByLabelText(/Confirm Password/i), 'pw12345678');
    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(result.fixture.componentInstance.error()).toBe('Email already taken');
    });
    expect(result.fixture.componentInstance.loading()).toBe(false);
    expect(routerNavigate).not.toHaveBeenCalled();
  });

  it('falls back to a default error message when no message is provided', async () => {
    register.mockReturnValue(throwError(() => ({})));
    const result = await renderRegister();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Full Name/i), 'Ada Lovelace');
    await user.type(screen.getByLabelText(/^Email/i), 'ada@example.com');
    await user.type(screen.getByLabelText(/^Password$/i), 'pw12345678');
    await user.type(screen.getByLabelText(/Confirm Password/i), 'pw12345678');
    await user.click(screen.getByRole('button', { name: /Create Account/i }));

    await waitFor(() => {
      expect(result.fixture.componentInstance.error()).toBe('Registration failed');
    });
  });

  it('toggles password visibility when the visibility button is clicked', async () => {
    const result = await renderRegister();
    const user = userEvent.setup();

    expect(result.fixture.componentInstance.hidePassword()).toBe(true);
    const visBtn = screen.getAllByText('visibility_off')[0].closest('button')!;
    await user.click(visBtn);
    expect(result.fixture.componentInstance.hidePassword()).toBe(false);
  });
});
