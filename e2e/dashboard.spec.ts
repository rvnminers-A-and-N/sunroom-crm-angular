import { test, expect } from './fixtures';

test.describe('Dashboard', () => {
  test('displays stat cards after login', async ({ page, authedUser }) => {
    void authedUser;
    await page.goto('/dashboard');

    await expect(page.locator('.dashboard__title')).toHaveText('Dashboard');
    await expect(page.getByText('Total Contacts')).toBeVisible();
    await expect(page.getByText('Total Companies')).toBeVisible();
    await expect(page.getByText('Active Deals')).toBeVisible();
    await expect(page.getByText('Pipeline Value')).toBeVisible();
    await expect(page.getByText('Won Revenue')).toBeVisible();
  });

  test('displays the pipeline chart', async ({ page, authedUser }) => {
    void authedUser;
    await page.goto('/dashboard');

    await expect(page.getByText('Pipeline by Stage')).toBeVisible();
    await expect(page.locator('canvas').first()).toBeVisible();
  });

  test('displays the recent activity list', async ({ page, authedUser }) => {
    void authedUser;
    await page.goto('/dashboard');

    await expect(page.getByText('Recent Activity')).toBeVisible();
    // The API may return seeded activities or an empty list depending on DB state;
    // just verify the section rendered (heading already asserted above).
    await expect(page.locator('.activity-list')).toBeVisible();
  });
});
