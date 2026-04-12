import { test as base, expect, Page } from '@playwright/test';

/**
 * Sunroom CRM Playwright fixtures.
 *
 * The Angular app talks to a real .NET API (default `http://localhost:5236/api`).
 * These fixtures know nothing about the API beyond the base URL — they drive the
 * UI exactly the way a real user would. Each test that needs an authenticated
 * session uses the `registerAndLogin` fixture to create a fresh user via the
 * register form, which is the cheapest way to guarantee an isolated identity
 * per test without poking the database directly.
 */

export interface TestUser {
  name: string;
  email: string;
  password: string;
}

export interface RegisterAndLoginFixture {
  user: TestUser;
}

function uniqueEmail(prefix: string): string {
  // Random + timestamp keeps each test run unique even when several tests run in parallel.
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}.${stamp}.${rand}@e2e.sunroom.test`;
}

export function makeUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    name: overrides.name ?? 'E2E User',
    email: overrides.email ?? uniqueEmail('user'),
    password: overrides.password ?? 'password123!',
  };
}

export async function registerNewUser(page: Page, user: TestUser = makeUser()): Promise<TestUser> {
  await page.goto('/auth/register');
  await page.getByLabel('Full Name').fill(user.name);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Confirm Password').fill(user.password);
  await page.getByRole('button', { name: /create account/i }).click();
  await page.waitForURL(/\/dashboard/);
  return user;
}

export async function loginExistingUser(page: Page, user: TestUser): Promise<void> {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/);
}

export const test = base.extend<{ authedUser: TestUser }>({
  authedUser: async ({ page }, use) => {
    const user = await registerNewUser(page);
    await use(user);
  },
});

export { expect };
