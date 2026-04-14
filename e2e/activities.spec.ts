import { test, expect } from './fixtures';

test.describe('Activities', () => {
  test('displays activities list page', async ({ page, authedUser }) => {
    void authedUser;
    await page.goto('/activities');

    await expect(page.locator('.page-header__title')).toHaveText('Activities');
    await expect(page.getByText('Filter by type')).toBeVisible();
    await expect(page.locator('.page-header button')).toBeVisible();
  });

  test('opens the create activity dialog', async ({ page, authedUser }) => {
    void authedUser;
    await page.goto('/activities');

    await page.getByRole('button', { name: /log activity/i }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/log activity/i)).toBeVisible();

    // Verify form fields
    await expect(dialog.getByLabel('Type')).toBeVisible();
    await expect(dialog.getByLabel('Subject')).toBeVisible();
    await expect(dialog.getByLabel('Contact')).toBeVisible();
    await expect(dialog.getByLabel('Deal')).toBeVisible();
    await expect(dialog.getByLabel('Body')).toBeVisible();

    // Verify action buttons
    await expect(dialog.getByRole('button', { name: /cancel/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /^log$/i })).toBeVisible();
  });
});
