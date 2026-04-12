import { test, expect } from './fixtures';

test.describe('Deals pipeline drag-and-drop', () => {
  test('a deal can be dragged from Lead into Qualified and persists across reload', async ({
    page,
    authedUser,
  }) => {
    void authedUser;

    // Seed a contact so the deal form can attach one (contactId is required).
    await page.goto('/contacts');
    await page.getByRole('button', { name: /add contact/i }).first().click();
    let dialog = page.getByRole('dialog');
    await dialog.getByLabel('First Name').fill('Pipeline');
    await dialog.getByLabel('Last Name').fill('Tester');
    await dialog.getByLabel('Email').fill('pipeline@example.com');
    await dialog.getByRole('button', { name: /^create$/i }).click();
    await expect(dialog).toBeHidden();

    // Create a deal in the Lead stage.
    await page.goto('/deals/pipeline');
    await page.getByRole('button', { name: /add deal/i }).first().click();
    dialog = page.getByRole('dialog');
    await dialog.getByLabel('Title').fill('Drag me');
    await dialog.getByLabel('Value ($)').fill('1000');

    // Stage select — pick Lead so we know where the deal starts.
    await dialog.getByLabel('Stage').click();
    await page.getByRole('option', { name: 'Lead' }).click();

    // Contact select — pick the only available contact.
    await dialog.getByLabel('Contact').click();
    await page.getByRole('option', { name: /pipeline tester/i }).click();

    await dialog.getByRole('button', { name: /^create$/i }).click();
    await expect(dialog).toBeHidden();

    const leadColumn = page.locator('#stage-Lead');
    const qualifiedColumn = page.locator('#stage-Qualified');

    const card = leadColumn.getByText('Drag me');
    await expect(card).toBeVisible();

    // Drag the card from Lead to Qualified.
    await card.dragTo(qualifiedColumn);

    await expect(qualifiedColumn.getByText('Drag me')).toBeVisible();
    await expect(leadColumn.getByText('Drag me')).toHaveCount(0);

    // Reload and confirm the move was persisted.
    await page.reload();
    await expect(page.locator('#stage-Qualified').getByText('Drag me')).toBeVisible();
    await expect(page.locator('#stage-Lead').getByText('Drag me')).toHaveCount(0);
  });
});
