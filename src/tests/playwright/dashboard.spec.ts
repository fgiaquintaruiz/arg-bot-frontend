import { test, expect } from './fixtures';

test.describe('Dashboard — authenticated', () => {
  test('shows live EUR/USDC rate from API', async ({ authenticatedPage: page }) => {
    // MOCK_API_DATA.rate = '1.0850'
    await expect(page.getByText('1.0850')).toBeVisible();
  });

  test('shows live USDC/ARS rate from API', async ({ authenticatedPage: page }) => {
    // MOCK_API_DATA.usdcArsRate = '1150.00'
    await expect(page.getByText(/1\.150,00|1150\.00/)).toBeVisible();
  });

  test('shows trading wizard on load', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Simulación')).toBeVisible();
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
