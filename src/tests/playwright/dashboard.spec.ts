import { test, expect } from './fixtures';

test.describe('Dashboard — authenticated', () => {
  test('shows greeting with user display name', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Bienvenido de vuelta,')).toBeVisible();
    // "Test E2E" — first name from TEST_USER.displayName
    await expect(page.getByText('Test')).toBeVisible();
  });

  test('shows live EUR/USDC rate from API', async ({ authenticatedPage: page }) => {
    // MOCK_API_DATA.rate = '1.0850'
    await expect(page.getByText('1.0850')).toBeVisible();
  });

  test('shows live USDC/ARS rate from API', async ({ authenticatedPage: page }) => {
    // MOCK_API_DATA.usdcArsRate = '1150.00'
    await expect(page.getByText(/1\.150,00|1150\.00/)).toBeVisible();
  });

  test('shows all primary action buttons', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: /Calculadora/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cambiar EUR/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Retirar ARS/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Historial de operaciones/ })).toBeVisible();
  });

  test('Cambiar EUR and Retirar ARS are locked without API keys', async ({ authenticatedPage: page }) => {
    // No localStorage binance_key/secret — buttons should show 🔒 Config API badge
    await expect(page.getByText('🔒 Config API').first()).toBeVisible();
  });

  test('Cambiar EUR is enabled when API keys are set', async ({ authenticatedPage: page }) => {
    await page.evaluate(() => {
      localStorage.setItem('binance_key', 'test-api-key');
      localStorage.setItem('binance_secret', 'test-api-secret');
    });
    await page.reload();
    await expect(page.getByText('Calculadora')).toBeVisible({ timeout: 10_000 });
    // Lock badge should be gone
    await expect(page.getByText('🔒 Config API')).not.toBeVisible();
  });

  test('settings icon opens Settings modal', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: 'Abrir configuración' }).click();
    await expect(page.getByText('Configuración')).toBeVisible();
    await expect(page.getByText('Sync')).toBeVisible();
  });

  test('Salir button is visible in header', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible();
  });

  test('version badge is shown in header', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/v\d+\.\d+\.\d+/)).toBeVisible();
  });

  test('Novedades modal opens from Dashboard', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /Novedades y Roadmap/ }).click();
    await expect(page.getByText('Novedades y Hoja de Ruta')).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar novedades' }).click();
    await expect(page.getByText('Novedades y Hoja de Ruta')).not.toBeVisible();
  });
});
