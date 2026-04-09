import { test, expect } from '@playwright/test';

test.describe('Task CRUD', () => {
  const testEmail = `e2e-tasks-${Date.now()}@example.com`;

  test.beforeEach(async ({ page }) => {
    // Register a fresh user
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Task E2E User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'Testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/tasks');
  });

  test('create → view → edit → delete task', async ({ page }) => {
    // Create
    await page.click('text=New Task');
    await page.waitForURL('/tasks/new');
    await page.fill('input[id="title"]', 'E2E Test Task');
    await page.fill('textarea', 'Created by Playwright');
    await page.selectOption('select >> nth=1', 'high');
    await page.click('button[type="submit"]');

    // Should redirect to task detail
    await expect(page.locator('h1')).toContainText('Edit Task');
    await expect(page.locator('input[id="title"]')).toHaveValue('E2E Test Task');

    // Edit
    await page.fill('input[id="title"]', 'Updated E2E Task');
    await page.click('button[type="submit"]');

    // Delete
    await page.click('text=Delete');
    await page.click('button:has-text("Delete"):not(:has-text("Cancel"))');
    await page.waitForURL('/tasks');
  });
});
