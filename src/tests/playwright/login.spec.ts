import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Continuar con Google/ })).toBeVisible({ timeout: 10_000 });
  });

  test('shows ARGBOT heading and tagline', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /ARGBOT/, level: 1 })).toBeVisible();
    await expect(page.getByText('Transferencias internacionales automatizadas')).toBeVisible();
  });

  test('shows Google sign-in button', async ({ page }) => {
    const btn = page.getByRole('button', { name: /Continuar con Google/ });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('shows access-restricted banner', async ({ page }) => {
    await expect(page.getByText(/Acceso restringido/)).toBeVisible();
    await expect(page.getByText(/Solo cuentas de Google previamente autorizadas/)).toBeVisible();
  });

  test('shows all four LandingDocs sections', async ({ page }) => {
    await expect(page.getByText('¿Cómo te ayuda ARGBOT?')).toBeVisible();
    await expect(page.getByText('Antes de arrancar')).toBeVisible();
    await expect(page.getByText('Tu plata, tu seguridad')).toBeVisible();
    await expect(page.getByText('¿Por qué confiar en ARGBOT?')).toBeVisible();
  });

  test('regression: soporte@argbot.app is NOT visible anywhere', async ({ page }) => {
    // Removed in commit 4f232ca — regression guard
    await expect(page.getByText('soporte@argbot.app')).not.toBeVisible();
  });

  test('trust section shows exactly 3 items after support removal', async ({ page }) => {
    const trustSection = page.locator('div').filter({ hasText: '¿Por qué confiar en ARGBOT?' }).last();
    await expect(trustSection.getByText('Encriptación AES-256 local')).toBeVisible();
    await expect(trustSection.getByText('Open Source')).toBeVisible();
    await expect(trustSection.getByText('Permisos mínimos', { exact: true })).toBeVisible();
    await expect(page.getByText('Soporte')).not.toBeVisible();
  });

  test('Novedades modal opens and closes', async ({ page }) => {
    await page.getByRole('button', { name: /Novedades y Roadmap/ }).click();
    await expect(page.getByText('Novedades y Hoja de Ruta')).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar novedades' }).click();
    await expect(page.getByText('Novedades y Hoja de Ruta')).not.toBeVisible();
  });

  test('Terms & Conditions modal opens showing legal header', async ({ page }) => {
    await page.getByRole('button', { name: /Términos y Condiciones/ }).click();
    await expect(page.getByText('Documentación Legal')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cerrar modal legal' })).toBeVisible();
  });

  test('Privacy Policy modal opens from Terms modal via tab', async ({ page }) => {
    await page.getByRole('button', { name: /Políticas de Privacidad/ }).click();
    await expect(page.getByText('Documentación Legal')).toBeVisible();
    // Policies tab should be active
    await expect(page.getByRole('button', { name: 'Políticas de Privacidad' }).first()).toBeVisible();
  });
});
