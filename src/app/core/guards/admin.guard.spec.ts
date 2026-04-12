import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';
import { makeUser } from '../../../testing/fixtures';
import type { User } from '../models/user.model';

describe('adminGuard', () => {
  let currentUser: User | null;
  let routerNavigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    currentUser = null;
    routerNavigate = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: {
            get currentUser() {
              return currentUser;
            },
          },
        },
        { provide: Router, useValue: { navigate: routerNavigate } },
      ],
    });
  });

  function run() {
    return TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  }

  it('returns true and does not navigate when the current user has the Admin role', () => {
    currentUser = makeUser({ role: 'Admin' });

    expect(run()).toBe(true);
    expect(routerNavigate).not.toHaveBeenCalled();
  });

  it('navigates to /dashboard and returns false when the current user is not an admin', () => {
    currentUser = makeUser({ role: 'User' });

    expect(run()).toBe(false);
    expect(routerNavigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('navigates to /dashboard and returns false when there is no current user', () => {
    currentUser = null;

    expect(run()).toBe(false);
    expect(routerNavigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
