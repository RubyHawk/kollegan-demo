import { test, expect, devices, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = 'http://127.0.0.1:3000';
const outputDir = path.resolve('.codex-artifacts/mobile');
const publicToken = process.env.PUBLIC_TOKEN || '69850fb7-1456-4312-9283-e57b713efde1';

const testDevices = [
  { key: '390', use: devices['iPhone 13'] },
  { key: '430', use: devices['iPhone 14 Plus'] },
] as const;

async function login(page: Page) {
  await page.goto(`${baseUrl}/logga-in?redirect=%2F`, { waitUntil: 'networkidle' });
  const devLink = page.getByText('Dev: logga in utan konto');
  if (await devLink.isVisible().catch(() => false)) {
    await devLink.click();
    await page.waitForLoadState('networkidle');
  }
}

async function capture(
  page: Page,
  deviceKey: string,
  name: string,
  pathname: string,
  report: Array<Record<string, unknown>>,
) {
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(outputDir, `${deviceKey}-${name}.png`), fullPage: true });
  report.push(await page.evaluate((label) => ({
    label,
    url: window.location.pathname + window.location.search,
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
    bodyHeight: document.body.scrollHeight,
  }), name));
}

for (const device of testDevices) {
  test(`mobile qa ${device.key}`, async ({ browser }) => {
    const report: Array<Record<string, unknown>> = [];
    await fs.mkdir(outputDir, { recursive: true });

    const context = await browser.newContext({ ...device.use });
    const page = await context.newPage();

    await login(page);

    await capture(page, device.key, 'dashboard', '/', report);
    await capture(page, device.key, 'offerter-list', '/offerter', report);
    await capture(page, device.key, 'offerter-step1', '/offerter?new=true', report);

    const firstTemplateName = (await page
      .locator('button p.text-sm.font-semibold')
      .first()
      .textContent()
      .catch(() => null))?.trim();

    if (firstTemplateName) {
      await page.getByRole('button', { name: firstTemplateName }).first().click();
      await page.getByPlaceholder('Namn *').fill('Mobiltest Soleria');
      await page.getByPlaceholder('E-post *').fill('alipoppin101@gmail.com');
      await page.getByRole('button', { name: 'Fortsätt' }).click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(outputDir, `${device.key}-offerter-step2.png`), fullPage: true });
      report.push(await page.evaluate(() => ({
        label: 'offerter-step2',
        url: window.location.pathname + window.location.search,
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
        bodyHeight: document.body.scrollHeight,
      })));
    } else {
      report.push({ label: 'offerter-step2', skipped: true, reason: 'No template card found in UI' });
    }

    await capture(page, device.key, 'produkter', '/produkter', report);
    await capture(page, device.key, 'mallar', '/mallar', report);
    await capture(page, device.key, 'mallar-ny', '/mallar/ny', report);
    await capture(page, device.key, 'utseende', '/installningar/utseende', report);
    await capture(page, device.key, 'public-offer', `/offerter/publik/${publicToken}`, report);

    await fs.writeFile(path.join(outputDir, `report-${device.key}.json`), JSON.stringify(report, null, 2), 'utf8');
    await context.close();

    expect(report.length).toBeGreaterThan(0);
  });
}
