import { test as base, expect, type Page } from '@playwright/test';
import { TEST_USER, MOCK_API_DATA, MOCK_SERVER_IP } from './mock-data';

type Fixtures = {
  authenticatedPage: Page;
  offlinePage: Page;
};

async function mockApis(page: Page): Promise<void> {
  await page.route('**/api/data', route =>
    route.fulfill({ json: MOCK_API_DATA })
  );
  await page.route('**/api/ip', route =>
    route.fulfill({ json: { ip: MOCK_SERVER_IP } })
  );
  await page.route('**/api/changelog', route =>
    route.fulfill({ body: '# Changelog\n- Tests running' })
  );
  // Neutralize update banner: only match the runtime fetch (`/version.json?t=...`), not Vite's
  // dev-time module import of `public/version.json` (which uses `?import` and expects a JS module).
  // Returning JSON for the import would break React's bootstrap and leave the page stuck at
  // index.html's "Cargando motor..." placeholder.
  await page.route(/\/version\.json\?t=/, route =>
    route.fulfill({ json: {} })
  );
}

async function injectTestUser(page: Page): Promise<void> {
  await page.addInitScript((user) => {
    (window as any).__E2E_USER__ = user;
  }, TEST_USER);
}

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ page }, use) => {
    await injectTestUser(page);
    await mockApis(page);
    await page.goto('/');
    await expect(page.getByText('ARGBOT')).toBeVisible({ timeout: 10_000 });
    await use(page);
  },

  offlinePage: async ({ page }, use) => {
    await injectTestUser(page);
    await page.route('**/api/data', route => route.abort());
    await page.route('**/api/ip', route => route.abort());
    await page.route('**/api/changelog', route => route.abort());
    await page.route(/\/version\.json\?t=/, route => route.fulfill({ json: {} }));
    await page.goto('/');
    // Dashboard renders with fallback data even when API fails
    await expect(page.getByText('ARGBOT')).toBeVisible({ timeout: 10_000 });
    await use(page);
  },
});

export { expect };
