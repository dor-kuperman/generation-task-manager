import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const email = `e2e-dash-${Date.now()}@example.com`;
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Dashboard User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/tasks');
  });

  test('navigates between pages via sidebar', async ({ page }) => {
    // Tasks page
    await expect(page.locator('h1')).toContainText('Tasks');

    // Analytics page
    await page.click('a:has-text("Analytics")');
    await expect(page.locator('h1')).toContainText('Analytics');

    // Pipeline page
    await page.click('a:has-text("Pipeline")');
    await expect(page.locator('h1')).toContainText('CDC Pipeline');

    // Back to Tasks
    await page.click('a:has-text("Tasks")');
    await expect(page.locator('h1')).toContainText('Tasks');
  });

  test('shows empty state when no tasks', async ({ page }) => {
    await expect(page.locator('text=No tasks found')).toBeVisible();
  });
});
