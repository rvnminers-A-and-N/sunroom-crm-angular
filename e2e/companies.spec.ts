import { test, expect } from './fixtures';

test.describe('Companies', () => {
  test('displays companies list page', async ({ page, authedUser }) => {
    void authedUser;
    await page.goto('/companies');

    // Verify page header
    await expect(page.locator('.page-header__title')).toHaveText('Companies');

    // Seed a company through the UI
    await page.getByRole('button', { name: /add company/i }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Company Name').fill('Acme Corp');
    await dialog.getByLabel('Industry').fill('Technology');
    await dialog.getByLabel('City').fill('San Francisco');
    await dialog.getByLabel('State').fill('CA');
    await dialog.getByRole('button', { name: /^create$/i }).click();
    await expect(dialog).toBeHidden();

    // Verify table renders with the seeded data
    const table = page.locator('table');
    await expect(table).toBeVisible();
    const row = page.getByRole('row', { name: /acme corp/i });
    await expect(row).toBeVisible();
    await expect(row).toContainText('Technology');
    await expect(row).toContainText('San Francisco');
  });

  test('opens the create company dialog', async ({ page, authedUser }) => {
    void authedUser;
    await page.goto('/companies');

    await page.getByRole('button', { name: /add company/i }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/new company/i)).toBeVisible();

    // Verify form fields
    await expect(dialog.getByLabel('Company Name')).toBeVisible();
    await expect(dialog.getByLabel('Industry')).toBeVisible();
    await expect(dialog.getByLabel('Website')).toBeVisible();
    await expect(dialog.getByLabel('Phone')).toBeVisible();

    // Verify action buttons
    await expect(dialog.getByRole('button', { name: /cancel/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /create/i })).toBeVisible();
  });

  test('navigates to company detail page', async ({ page, authedUser }) => {
    void authedUser;
    await page.goto('/companies');

    // Seed a company
    await page.getByRole('button', { name: /add company/i }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Company Name').fill('Detail Test Inc');
    await dialog.getByLabel('Industry').fill('Finance');
    await dialog.getByRole('button', { name: /^create$/i }).click();
    await expect(dialog).toBeHidden();

    // Click the row to navigate to detail
    await page.getByRole('row', { name: /detail test inc/i }).click();

    // Verify detail page
    await expect(page).toHaveURL(/\/companies\/\d+/);
    await expect(page.getByRole('heading', { name: /detail test inc/i })).toBeVisible();
  });
});
