import { test, expect, makeUser, registerNewUser, loginExistingUser } from './fixtures';

test.describe('Authentication', () => {
  test('register a new user lands on the dashboard', async ({ page }) => {
    const user = makeUser();
    await registerNewUser(page, user);

    await expect(page).toHaveURL(/\/dashboard$/);
    // Sidebar shows the freshly created user's name and role.
    await expect(page.getByText(user.name)).toBeVisible();
  });

  test('register, log out, log back in', async ({ page }) => {
    const user = await registerNewUser(page);

    // Log out via the sidebar logout button (tooltip "Logout").
    await page.getByRole('button', { name: /logout/i }).click();
    await page.waitForURL(/\/auth\/login$/);

    await loginExistingUser(page, user);
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('login form rejects invalid credentials with an inline error', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email').fill('nobody@example.com');
    await page.getByLabel('Password').fill('wrongpassword!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // The auth-card error region renders any non-empty error string.
    await expect(page.locator('.auth-card__error')).toBeVisible();
  });

  test('register form requires matching passwords', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByLabel('Full Name').fill('Mismatch User');
    await page.getByLabel('Email').fill(makeUser().email);
    await page.getByLabel('Password', { exact: true }).fill('password123!');
    await page.getByLabel('Confirm Password').fill('different456!');

    // Trigger validation by blurring the confirm field.
    await page.getByLabel('Confirm Password').blur();
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test('unauthenticated user is redirected from the dashboard to the login page', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/auth\/login$/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });
});
