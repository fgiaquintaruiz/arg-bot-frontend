import { test, expect } from './fixtures';

test.describe('Settings Modal', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: 'Abrir configuración' }).click();
    await expect(page.getByText('Configuración')).toBeVisible();
  });

  test('opens with Sync tab active by default', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Sincronización con Google Drive')).toBeVisible();
  });

  test('has Sync and Binance tabs', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: 'Sync' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Binance' })).toBeVisible();
  });

  test('regression: Soporte tab does NOT exist', async ({ authenticatedPage: page }) => {
    // Removed in commit 4f232ca — regression guard
    await expect(page.getByRole('button', { name: 'Soporte' })).not.toBeVisible();
    await expect(page.getByText('soporte@argbot.app')).not.toBeVisible();
  });

  test('Binance tab shows all SEPA and API key fields', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: 'Binance' }).click();
    await expect(page.getByPlaceholder('Tu nombre en Binance')).toBeVisible();
    await expect(page.getByPlaceholder(/LT12/)).toBeVisible();
    await expect(page.getByPlaceholder('REVOLT21XXX')).toBeVisible();
    await expect(page.getByPlaceholder('Tu API Key')).toBeVisible();
    await expect(page.getByPlaceholder('Tu API Secret')).toBeVisible();
  });

  test('shows server IP for Binance whitelist on Binance tab', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: 'Binance' }).click();
    await expect(page.getByText('203.0.113.42')).toBeVisible();
  });

  test('saving Binance config shows confirmation', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: 'Binance' }).click();
    await page.getByPlaceholder(/LT12/).fill('LT96 3230 0000 0000 9999');
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('✓ Guardado')).toBeVisible();
  });

  test('close button dismisses the modal', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: 'Cerrar configuración' }).click();
    await expect(page.getByText('Configuración')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible();
  });

  test('Drive sync Subir button is enabled', async ({ authenticatedPage: page }) => {
    const uploadBtn = page.getByRole('button', { name: /Subir a Drive/ });
    await expect(uploadBtn).toBeVisible();
    await expect(uploadBtn).toBeEnabled();
  });

  test('Drive sync Descargar button is enabled', async ({ authenticatedPage: page }) => {
    const downloadBtn = page.getByRole('button', { name: /Descargar de Drive/ });
    await expect(downloadBtn).toBeVisible();
    await expect(downloadBtn).toBeEnabled();
  });

  test('settings opens directly on Binance tab via custom event', async ({ authenticatedPage: page }) => {
    // Close current modal first
    await page.getByRole('button', { name: 'Cerrar configuración' }).click();
    // Dispatch custom event (same as TradingWizard's IBAN warning link)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('open-settings', { detail: { tab: 'binance' } }));
    });
    await expect(page.getByText('Configuración de Binance')).toBeVisible();
  });
});
