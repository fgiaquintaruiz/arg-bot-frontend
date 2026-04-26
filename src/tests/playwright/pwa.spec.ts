import { test, expect } from './fixtures';

test.describe('PWA and Mobile behavior', () => {
  test('app renders correctly on mobile viewport', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('ARGBOT')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible();
  });

  test('access-restricted banner is always visible in Dashboard', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Acceso restringido — solo usuarios autorizados')).toBeVisible();
  });

  test('backend offline: Dashboard shows fallback rate data', async ({ offlinePage: page }) => {
    // When API fails, Dashboard catch block provides fallback: rate=1.08, usdcArsRate=1150.50
    await expect(page.getByText('1.0800')).toBeVisible();
  });

  test('Settings modal is scrollable on mobile', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: 'Abrir configuración' }).click();
    await page.getByRole('button', { name: 'Binance' }).click();
    await expect(page.getByText('Configuración de Binance')).toBeVisible();
    // Scroll inside the modal to reveal API key fields below the fold
    await page.getByPlaceholder('Tu API Key').scrollIntoViewIfNeeded();
    await expect(page.getByPlaceholder('Tu API Key')).toBeVisible();
  });

  test('History view is accessible from Dashboard', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /Historial de operaciones/ }).click();
    await expect(page.getByText(/Historial|Operaciones/i).first()).toBeVisible();
  });
});
