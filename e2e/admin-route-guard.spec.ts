import { test, expect } from './fixtures';

test.describe('Admin route guard', () => {
  test('newly registered (non-admin) users are redirected away from /admin', async ({
    page,
    authedUser,
  }) => {
    void authedUser;

    // Brand-new accounts have role "User", not "Admin".
    await page.goto('/admin');

    // adminGuard navigates to /dashboard and returns false.
    await page.waitForURL(/\/dashboard$/);
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('the Users sidebar entry is hidden for non-admin users', async ({ page, authedUser }) => {
    void authedUser;
    await page.goto('/dashboard');

    // The sidebar nav uses an `<a>` with text "Users" only when the user is admin.
    await expect(page.getByRole('link', { name: /^users$/i })).toHaveCount(0);
  });
});
