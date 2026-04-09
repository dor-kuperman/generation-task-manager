import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  const testUser = {
    name: 'E2E Test User',
    email: `e2e-auth-${Date.now()}@example.com`,
    password: 'Testpassword123',
  };

  test('register → login → dashboard → logout', async ({ page }) => {
    // Register
    await page.goto('/register');
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/tasks');
    await expect(page.locator('main h1')).toContainText('Tasks');

    // Logout
    await page.click('text=Log out');
    await page.waitForURL('/login');

    // Login
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/tasks');
    await expect(page.locator('main h1')).toContainText('Tasks');
  });

  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForURL('/login');
  });

  test('shows error on invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('.bg-red-50')).toBeVisible();
  });
});
