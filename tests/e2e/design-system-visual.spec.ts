import { test, expect } from '@playwright/test';

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

const routes = [
  { name: 'dashboard', path: '/' },
  { name: 'projects', path: '/projekt' },
  { name: 'offers', path: '/offerter' },
  { name: 'products', path: '/produkter' },
  { name: 'settings', path: '/installningar' },
];

test.describe('Quiet ERP visual baselines', () => {
  for (const route of routes) {
    test(`${route.name} desktop`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${baseUrl}${route.path}`);
      await expect(page).toHaveScreenshot(`quiet-erp-${route.name}-desktop.png`, { fullPage: true });
    });

    test(`${route.name} mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${baseUrl}${route.path}`);
      await expect(page).toHaveScreenshot(`quiet-erp-${route.name}-mobile.png`, { fullPage: true });
    });
  }
});

