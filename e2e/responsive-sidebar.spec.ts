import { test, expect } from './fixtures';

test.describe('Responsive sidebar', () => {
  test.use({ viewport: { width: 480, height: 800 } });

  test('the sidebar collapses after navigating on a narrow viewport', async ({
    page,
    authedUser,
  }) => {
    void authedUser;
    await page.goto('/dashboard');

    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar).toBeVisible();

    // Open the sidebar (from the collapsed initial state on mobile).
    await page.locator('.sidebar__toggle').click();
    await expect(sidebar).not.toHaveClass(/sidebar--collapsed/);

    // Navigate to the contacts route — the layout component should re-collapse it.
    await page.getByRole('link', { name: /contacts/i }).click();
    await page.waitForURL(/\/contacts$/);

    await expect(sidebar).toHaveClass(/sidebar--collapsed/);
  });
});
