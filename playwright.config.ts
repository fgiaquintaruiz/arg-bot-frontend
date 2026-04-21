import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests/playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:10000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'pwa',
      use: {
        ...devices['Pixel 5'],
        serviceWorkers: 'allow',
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:10000',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
