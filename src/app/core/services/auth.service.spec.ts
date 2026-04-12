import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { http, HttpResponse } from 'msw';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';
import { server } from '../../../testing/msw/server';
import { makeAuthResponse, makeUser } from '../../../testing/fixtures';

const API = environment.apiUrl;
const TOKEN_KEY = 'sunroom_token';

describe('AuthService', () => {
  let service: AuthService;
  let routerNavigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    routerNavigate = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        ApiService,
        AuthService,
        { provide: Router, useValue: { navigate: routerNavigate } },
      ],
    });
    service = TestBed.inject(AuthService);
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
      const fixture = makeAuthResponse({ token: 'login-token', user: makeUser({ id: 7 }) });
      server.use(http.post(`${API}/auth/login`, () => HttpResponse.json(fixture)));

      const response = await firstValueFrom(
        service.login({ email: 'a@b.c', password: 'pw' }),
      );

      expect(response).toEqual(fixture);
      expect(localStorage.getItem(TOKEN_KEY)).toBe('login-token');
      expect(service.currentUser).toEqual(fixture.user);
      expect(await firstValueFrom(service.currentUser$)).toEqual(fixture.user);
    });
  });

  describe('register', () => {
    it('stores the token and emits the user on success', async () => {
      const fixture = makeAuthResponse({ token: 'register-token', user: makeUser({ id: 9 }) });
      server.use(http.post(`${API}/auth/register`, () => HttpResponse.json(fixture)));

      const response = await firstValueFrom(
        service.register({ name: 'X', email: 'x@y.z', password: 'pw12345678' }),
      );

      expect(response).toEqual(fixture);
      expect(localStorage.getItem(TOKEN_KEY)).toBe('register-token');
      expect(service.currentUser).toEqual(fixture.user);
    });
  });

  describe('loadCurrentUser', () => {
    it('updates the current user from the API', async () => {
      const fixture = makeUser({ id: 42, name: 'Loaded' });
      server.use(http.get(`${API}/auth/me`, () => HttpResponse.json(fixture)));

      const result = await firstValueFrom(service.loadCurrentUser());

      expect(result).toEqual(fixture);
      expect(service.currentUser).toEqual(fixture);
    });
  });

  describe('logout', () => {
    it('clears the token, emits null, and navigates to login', async () => {
      localStorage.setItem(TOKEN_KEY, 'some-token');
      const fixture = makeAuthResponse();
      server.use(http.post(`${API}/auth/login`, () => HttpResponse.json(fixture)));
      await firstValueFrom(service.login({ email: 'a@b.c', password: 'pw' }));

      service.logout();

      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(service.currentUser).toBeNull();
      expect(routerNavigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });
});
