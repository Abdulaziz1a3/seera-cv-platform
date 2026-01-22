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

test.describe('critical pages', () => {
    test('signup page renders', async ({ page }) => {
        await page.goto('/signup');
        await expect(page.locator('form')).toBeVisible();
    });

    test('404 page handles not found gracefully', async ({ page }) => {
        const response = await page.goto('/this-page-does-not-exist-12345');
        expect(response?.status()).toBe(404);
    });

    test('pricing page loads', async ({ page }) => {
        await page.goto('/pricing');
        await expect(page).toHaveTitle(/Seera|CV|Resume|Pricing/i);
    });
});

test.describe('api health', () => {
    test('health endpoint returns healthy status', async ({ request }) => {
        const response = await request.get('/api/health');
        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        expect(body.status).toMatch(/healthy|degraded/);
        expect(body.checks.database).toBeDefined();
        expect(body.checks.memory).toBeDefined();
    });
});
