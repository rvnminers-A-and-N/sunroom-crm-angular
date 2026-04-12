import { describe, it, expect } from 'vitest';
import { AUTH_ROUTES } from './auth.routes';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

describe('AUTH_ROUTES', () => {
  it('exposes login, register, and a default redirect to login', () => {
    expect(AUTH_ROUTES.map((r) => r.path)).toEqual(['login', 'register', '']);
  });

  it('lazy-loads the LoginComponent on the login path', async () => {
    const route = AUTH_ROUTES.find((r) => r.path === 'login')!;
    const loaded = await (route.loadComponent as () => Promise<unknown>)();
    expect(loaded).toBe(LoginComponent);
  });

  it('lazy-loads the RegisterComponent on the register path', async () => {
    const route = AUTH_ROUTES.find((r) => r.path === 'register')!;
    const loaded = await (route.loadComponent as () => Promise<unknown>)();
    expect(loaded).toBe(RegisterComponent);
  });

  it('redirects the empty path to login with a full path match', () => {
    const empty = AUTH_ROUTES.find((r) => r.path === '')!;
    expect(empty.redirectTo).toBe('login');
    expect(empty.pathMatch).toBe('full');
  });
});
