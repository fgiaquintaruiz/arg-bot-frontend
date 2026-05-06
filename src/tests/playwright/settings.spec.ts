import { test, expect } from './fixtures';

test.describe('Settings Modal', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: 'Abrir configuración' }).click();
    // Use heading role to avoid strict-mode conflict with breadcrumb "Configuración → Binance"
    await expect(page.getByRole('heading', { name: 'Configuración' })).toBeVisible();
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
    // Check that the Settings heading (h2) is no longer visible
    await expect(page.getByRole('heading', { name: 'Configuración' })).not.toBeVisible();
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

  test('Alertas tab is present and navigable', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: 'Alertas' }).click();
    await expect(page.getByText('Alertas de tasa')).toBeVisible();
  });

  test('Alertas tab shows USDC/ARS override input', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: 'Alertas' }).click();
    await expect(page.getByPlaceholder(/Ej: 1464\.67/)).toBeVisible();
  });

  test('USDC/ARS override: typing a value updates the rate strip label via localStorage', async ({ authenticatedPage: page }) => {
    // The wizard reads usdcArs from localStorage USDC_ARS_OVERRIDE at render time.
    // We open Settings → Alertas, type an override, then close and reload to
    // confirm the wizard fee-breakdown reflects the new rate.
    await page.getByRole('button', { name: 'Alertas' }).click();
    const overrideInput = page.getByPlaceholder(/Ej: 1464\.67/);
    await overrideInput.fill('9999');
    await page.getByRole('button', { name: 'Cerrar configuración' }).click();
    // Reload to re-render wizard with the persisted override in localStorage
    await page.reload();
    await expect(page.getByText('ARGBOT')).toBeVisible({ timeout: 10_000 });
    // The fee-breakdown label shows "USDC destino (9999)"
    await expect(page.getByText(/USDC destino \(9999\)/)).toBeVisible();
  });

  test('USDC/ARS override: clearing the value falls back to market rate', async ({ authenticatedPage: page }) => {
    // Pre-seed the override via localStorage, then clear it via Settings UI
    await page.evaluate(() => localStorage.setItem('usdc_ars_override', '9999'));
    await page.reload();
    await expect(page.getByText('ARGBOT')).toBeVisible({ timeout: 10_000 });
    // Confirm override is active
    await expect(page.getByText(/USDC destino \(9999\)/)).toBeVisible();
    // Now clear it through Settings
    await page.getByRole('button', { name: 'Abrir configuración' }).click();
    await expect(page.getByRole('heading', { name: 'Configuración' })).toBeVisible();
    await page.getByRole('button', { name: 'Alertas' }).click();
    const overrideInput = page.getByPlaceholder(/Ej: 1464\.67/);
    await overrideInput.fill('');
    await page.getByRole('button', { name: 'Cerrar configuración' }).click();
    await page.reload();
    await expect(page.getByText('ARGBOT')).toBeVisible({ timeout: 10_000 });
    // Falls back to market rate from MOCK_API_DATA.usdcArsRate = '1150.00' → shown as 1150
    await expect(page.getByText(/USDC destino \(1150\)/)).toBeVisible();
  });
});
