import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';
import { makeAuthResponse, makeUser } from '../../../testing/fixtures';

const API = environment.apiUrl;
const TOKEN_KEY = 'sunroom_token';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerNavigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    routerNavigate = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
        AuthService,
        { provide: Router, useValue: { navigate: routerNavigate } },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('isAuthenticated', () => {
    it('returns true when a token is stored', () => {
      localStorage.setItem(TOKEN_KEY, 'abc');
      expect(service.isAuthenticated).toBe(true);
    });

    it('returns false when no token is stored', () => {
      expect(service.isAuthenticated).toBe(false);
    });
  });

  describe('getToken', () => {
    it('reads the token from localStorage', () => {
      localStorage.setItem(TOKEN_KEY, 'xyz');
      expect(service.getToken()).toBe('xyz');
    });

    it('returns null when no token is stored', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('currentUser getter', () => {
    it('starts as null', () => {
      expect(service.currentUser).toBeNull();
    });
  });

  describe('login', () => {
    it('stores the token and emits the user on success', async () => {
      const fixture = makeAuthResponse({
        token: 'login-token',
        user: makeUser({ id: 7 }),
      });

      const result$ = firstValueFrom(
        service.login({ email: 'a@b.c', password: 'pw' }),
      );

      const req = httpMock.expectOne(`${API}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'a@b.c', password: 'pw' });
      req.flush(fixture);

      const response = await result$;
      expect(response).toEqual(fixture);
      expect(localStorage.getItem(TOKEN_KEY)).toBe('login-token');
      expect(service.currentUser).toEqual(fixture.user);
      expect(await firstValueFrom(service.currentUser$)).toEqual(fixture.user);
    });
  });

  describe('register', () => {
    it('stores the token and emits the user on success', async () => {
      const fixture = makeAuthResponse({
        token: 'register-token',
        user: makeUser({ id: 9 }),
      });

      const result$ = firstValueFrom(
        service.register({ name: 'X', email: 'x@y.z', password: 'pw12345678' }),
      );

      const req = httpMock.expectOne(`${API}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        name: 'X',
        email: 'x@y.z',
        password: 'pw12345678',
      });
      req.flush(fixture);

      const response = await result$;
      expect(response).toEqual(fixture);
      expect(localStorage.getItem(TOKEN_KEY)).toBe('register-token');
      expect(service.currentUser).toEqual(fixture.user);
    });
  });

  describe('loadCurrentUser', () => {
    it('updates the current user from the API', async () => {
      const fixture = makeUser({ id: 42, name: 'Loaded' });

      const result$ = firstValueFrom(service.loadCurrentUser());

      const req = httpMock.expectOne(`${API}/auth/me`);
      expect(req.request.method).toBe('GET');
      req.flush(fixture);

      const result = await result$;
      expect(result).toEqual(fixture);
      expect(service.currentUser).toEqual(fixture);
    });
  });

  describe('logout', () => {
    it('clears the token, emits null, and navigates to login', async () => {
      // Set up an authenticated state via login
      const fixture = makeAuthResponse();
      const login$ = firstValueFrom(
        service.login({ email: 'a@b.c', password: 'pw' }),
      );
      httpMock.expectOne(`${API}/auth/login`).flush(fixture);
      await login$;

      service.logout();

      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(service.currentUser).toBeNull();
      expect(routerNavigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });
});
