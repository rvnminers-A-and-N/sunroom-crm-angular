import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for sunroom-crm-angular E2E tests.
 *
 * The web server runs `ng serve` automatically. Tests assume the .NET API
 * (sunroom-crm-dotnet) is running on http://localhost:5236 — this is the same
 * URL the production frontend uses (`environment.apiUrl`). The full E2E suite
 * is added in the `feature/test-e2e` branch; this file lives here to keep all
 * test infrastructure in one branch.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
