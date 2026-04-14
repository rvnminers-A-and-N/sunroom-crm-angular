import { test, expect } from './fixtures';

async function ensureSidebarExpanded(page: import('@playwright/test').Page) {
  const sidebar = page.locator('aside.sidebar');
  const isCollapsed = await sidebar.evaluate((el) =>
    el.classList.contains('sidebar--collapsed'),
  );
  if (isCollapsed) {
    await page.locator('.toolbar__menu-btn').click();
    await expect(sidebar).not.toHaveClass(/sidebar--collapsed/);
  }
}

test.describe('Navigation & Layout', () => {
  test('sidebar contains all main navigation links', async ({ page, authedUser }) => {
    void authedUser;
    await page.goto('/dashboard');
    await ensureSidebarExpanded(page);

    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar.locator('.sidebar__link', { hasText: 'Dashboard' })).toBeVisible();
    await expect(sidebar.locator('.sidebar__link', { hasText: 'Contacts' })).toBeVisible();
    await expect(sidebar.locator('.sidebar__link', { hasText: 'Companies' })).toBeVisible();
    await expect(sidebar.locator('.sidebar__link', { hasText: 'Deals' })).toBeVisible();
    await expect(sidebar.locator('.sidebar__link', { hasText: 'Activities' })).toBeVisible();
    await expect(sidebar.locator('.sidebar__link', { hasText: 'AI Assistant' })).toBeVisible();
    await expect(sidebar.locator('.sidebar__link', { hasText: 'Settings' })).toBeVisible();

    // Users link is admin-only, should be hidden for a regular user
    await expect(sidebar.locator('.sidebar__link', { hasText: 'Users' })).toHaveCount(0);
  });

  test('navigates between main sections', async ({ page, authedUser }) => {
    void authedUser;
    await page.goto('/dashboard');
    await ensureSidebarExpanded(page);

    await page.locator('.sidebar__link', { hasText: 'Contacts' }).click();
    await expect(page).toHaveURL(/\/contacts/);

    await page.locator('.sidebar__link', { hasText: 'Companies' }).click();
    await expect(page).toHaveURL(/\/companies/);

    await page.locator('.sidebar__link', { hasText: 'Deals' }).click();
    await expect(page).toHaveURL(/\/deals/);

    await page.locator('.sidebar__link', { hasText: 'Activities' }).click();
    await expect(page).toHaveURL(/\/activities/);

    await page.locator('.sidebar__link', { hasText: 'Dashboard' }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('settings page displays user profile', async ({ page, authedUser }) => {
    await page.goto('/settings');

    await expect(page.locator('.page-header__title')).toHaveText('Settings');
    await expect(page.locator('.profile-card h3')).toHaveText('Profile');
    await expect(page.locator('.profile-info__name')).toHaveText(authedUser.name);
    await expect(page.locator('.profile-info__email')).toHaveText(authedUser.email);
    await expect(page.locator('.profile-info__role')).toContainText('User');
    await expect(page.getByText(/member since/i)).toBeVisible();

    // Tags section
    await expect(page.locator('.tags-card h3')).toHaveText('Tags');
    await expect(page.getByLabel('Tag name')).toBeVisible();
    await expect(page.getByRole('button', { name: /add tag/i })).toBeVisible();
  });

  test('AI panel is accessible with search and summarize', async ({ page, authedUser }) => {
    void authedUser;
    await page.goto('/ai');

    await expect(page.locator('.page-header__title')).toHaveText('AI Assistant');
    await expect(page.getByRole('tab', { name: 'Smart Search' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Summarize' })).toBeVisible();
  });

  test('unknown routes redirect to dashboard', async ({ page, authedUser }) => {
    void authedUser;
    await page.goto('/nonexistent-route');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
