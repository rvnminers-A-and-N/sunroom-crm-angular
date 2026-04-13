import { test, expect } from './fixtures';

test.describe('Contacts CRUD', () => {
  test('a logged-in user can create, edit, and delete a contact', async ({ page, authedUser }) => {
    void authedUser; // ensures the registration fixture ran
    await page.goto('/contacts');

    // Create
    await page.getByRole('button', { name: /add contact/i }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('First Name').fill('Ada');
    await dialog.getByLabel('Last Name').fill('Lovelace');
    await dialog.getByLabel('Email').fill('ada@example.com');
    await dialog.getByLabel('Phone').fill('+1-555-0100');
    await dialog.getByLabel('Title').fill('Mathematician');
    await dialog.getByRole('button', { name: /^create$/i }).click();
    await expect(dialog).toBeHidden();

    // List
    const row = page.getByRole('row', { name: /ada lovelace/i });
    await expect(row).toBeVisible();
    await expect(row).toContainText('ada@example.com');

    // Edit — icon-only buttons use mat-icon text (aria-hidden),
    // so getByRole won't find them; use filter({ hasText }) instead.
    await row.locator('button').filter({ hasText: 'edit' }).click();
    const editDialog = page.getByRole('dialog');
    await editDialog.getByLabel('Title').fill('Pioneer');
    await editDialog.getByRole('button', { name: /^save$/i }).click();
    await expect(editDialog).toBeHidden();
    await expect(page.getByRole('row', { name: /ada lovelace/i })).toContainText('Pioneer');

    // Delete (confirm dialog)
    await page
      .getByRole('row', { name: /ada lovelace/i })
      .locator('button')
      .filter({ hasText: 'delete' })
      .click();
    const confirm = page.getByRole('dialog');
    await confirm.getByRole('button', { name: /delete/i }).click();
    await expect(page.getByRole('row', { name: /ada lovelace/i })).toHaveCount(0);
  });

  test('search filters the contact list', async ({ page, authedUser }) => {
    void authedUser;
    await page.goto('/contacts');

    // Seed two contacts so the search has something to filter on.
    for (const c of [
      { first: 'Grace', last: 'Hopper', email: 'grace@example.com' },
      { first: 'Linus', last: 'Torvalds', email: 'linus@example.com' },
    ]) {
      await page.getByRole('button', { name: /add contact/i }).first().click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel('First Name').fill(c.first);
      await dialog.getByLabel('Last Name').fill(c.last);
      await dialog.getByLabel('Email').fill(c.email);
      await dialog.getByRole('button', { name: /^create$/i }).click();
      await expect(dialog).toBeHidden();
    }

    // Search by name; only Grace should remain.
    await page.getByLabel('Search contacts').fill('Grace');
    await expect(page.getByRole('row', { name: /grace hopper/i })).toBeVisible();
    await expect(page.getByRole('row', { name: /linus torvalds/i })).toHaveCount(0);
  });
});
