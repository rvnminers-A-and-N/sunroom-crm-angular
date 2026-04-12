import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

describe('errorInterceptor', () => {
  let logout: ReturnType<typeof vi.fn>;
  let notifyError: ReturnType<typeof vi.fn>;
  let routerNavigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    logout = vi.fn();
    notifyError = vi.fn();
    routerNavigate = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { logout } },
        { provide: NotificationService, useValue: { error: notifyError } },
        { provide: Router, useValue: { navigate: routerNavigate } },
      ],
    });
  });

  function run(error: HttpErrorResponse) {
    const req = new HttpRequest('GET', '/widgets');
    const next: HttpHandlerFn = () => throwError(() => error);
    let caught: unknown = null;

    TestBed.runInInjectionContext(() => {
      errorInterceptor(req, next).subscribe({
        next: () => undefined,
        error: (err) => {
          caught = err;
        },
      });
    });

    return caught;
  }

  it('logs the user out and rethrows on 401 errors without showing a notification', () => {
    const error = new HttpErrorResponse({ status: 401 });

    const caught = run(error);

    expect(logout).toHaveBeenCalled();
    expect(notifyError).not.toHaveBeenCalled();
    expect(caught).toBe(error);
  });

  it('shows the error.message via NotificationService for non-401 errors', () => {
    const error = new HttpErrorResponse({
      status: 500,
      error: { message: 'Server exploded' },
    });

    const caught = run(error);

    expect(notifyError).toHaveBeenCalledWith('Server exploded');
    expect(logout).not.toHaveBeenCalled();
    expect(caught).toBe(error);
  });

  it('falls back to error.title when message is not present', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { title: 'Bad Request' },
    });

    run(error);

    expect(notifyError).toHaveBeenCalledWith('Bad Request');
  });

  it('uses a default message when neither message nor title are provided', () => {
    const error = new HttpErrorResponse({ status: 503, error: {} });

    run(error);

    expect(notifyError).toHaveBeenCalledWith('An unexpected error occurred');
  });

  it('uses the default message when the error body is null', () => {
    const error = new HttpErrorResponse({ status: 502, error: null });

    run(error);

    expect(notifyError).toHaveBeenCalledWith('An unexpected error occurred');
  });
});
