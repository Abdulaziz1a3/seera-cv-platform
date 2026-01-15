import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
    test('landing page loads', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Seera|CV|Resume/i);
    });

    test('login page renders', async ({ page }) => {
        await page.goto('/login');
        await expect(page.locator('#email')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
    });

    test('auth flow (optional)', async ({ page }) => {
        const email = process.env.TEST_USER_EMAIL;
        const password = process.env.TEST_USER_PASSWORD;

        test.skip(!email || !password, 'TEST_USER_EMAIL/TEST_USER_PASSWORD not set');

        await page.goto('/login');
        await page.fill('#email', email || '');
        await page.fill('#password', password || '');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 20_000 });
        await expect(page).toHaveURL(/dashboard/);
    });
});
