import { HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let getToken: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getToken = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { getToken } }],
    });
  });

  function run(req: HttpRequest<unknown>): HttpRequest<unknown> {
    const captured: { value: HttpRequest<unknown> | null } = { value: null };
    const next: HttpHandlerFn = (passed) => {
      captured.value = passed;
      return of(new HttpResponse({ status: 200 }));
    };

    TestBed.runInInjectionContext(() => {
      authInterceptor(req, next).subscribe();
    });

    if (captured.value === null) {
      throw new Error('next was not invoked');
    }
    return captured.value;
  }

  it('adds an Authorization header with the bearer token when one is available', () => {
    getToken.mockReturnValue('abc123');

    const result = run(new HttpRequest('GET', '/widgets'));

    expect(result.headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('forwards the request unchanged when no token is available', () => {
    getToken.mockReturnValue(null);

    const original = new HttpRequest('GET', '/widgets');
    const result = run(original);

    expect(result.headers.has('Authorization')).toBe(false);
    expect(result).toBe(original);
  });
});
