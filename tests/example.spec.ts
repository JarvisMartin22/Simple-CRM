import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Simple CRM/);
});

test('login link is visible', async ({ page }) => {
  await page.goto('/');

  // Check if login link is visible
  const loginLink = page.getByRole('link', { name: /sign in/i });
  await expect(loginLink).toBeVisible();
});