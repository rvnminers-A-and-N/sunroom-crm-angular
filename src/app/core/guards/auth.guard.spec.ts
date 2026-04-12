import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authenticated: boolean;
  let routerNavigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    authenticated = false;
    routerNavigate = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            get isAuthenticated() {
              return authenticated;
            },
          },
        },
        { provide: Router, useValue: { navigate: routerNavigate } },
      ],
    });
  });

  function run() {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  it('returns true and does not navigate when the user is authenticated', () => {
    authenticated = true;

    expect(run()).toBe(true);
    expect(routerNavigate).not.toHaveBeenCalled();
  });

  it('navigates to /auth/login and returns false when the user is not authenticated', () => {
    authenticated = false;

    expect(run()).toBe(false);
    expect(routerNavigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
