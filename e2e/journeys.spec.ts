/**
 * Journey smoke (Q2): public shells + route reachability.
 * Authenticated A–K need credentials — gated behind E2E_EMAIL/E2E_PASSWORD.
 */
import { test, expect } from '@playwright/test';

test.describe('Journey shells A–K (public / auth gate)', () => {
  test('A: welcome / register / login load', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page).toHaveURL(/welcome|login|register/i);
    // Landing or redirect should render something interactive
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"], #email').first()).toBeVisible({
      timeout: 15_000,
    });

    await page.goto('/register');
    await expect(page.locator('body')).toBeVisible();
  });

  test('C/K gate: protected hubs redirect when anonymous', async ({ page }) => {
    for (const path of ['/dashboard', '/health', '/feed', '/finance', '/stock', '/records', '/eggs']) {
      await page.goto(path);
      // ProtectedRoute → welcome or login
      await expect(page).not.toHaveURL(new RegExp(`${path}$`));
    }
  });

  test('J surface: no hard crash on 404', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Authenticated A–K (optional)', () => {
  test.skip(!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD, 'Set E2E_EMAIL + E2E_PASSWORD for live farm smoke');

  test('login and open core hubs', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"], input[name="email"]').first().fill(process.env.E2E_EMAIL!);
    await page.locator('input[type="password"], input[name="password"]').first().fill(process.env.E2E_PASSWORD!);
    await page.getByRole('button', { name: /sign in|log in|continue/i }).first().click();
    await page.waitForURL(/dashboard|farm-setup|health|feed/i, { timeout: 30_000 });

    // Touch key hubs without asserting data (smoke only)
    for (const path of ['/dashboard', '/health', '/feed', '/stock', '/finance']) {
      await page.goto(path);
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible({ timeout: 15_000 });
    }
  });
});
