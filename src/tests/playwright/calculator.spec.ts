import { test, expect } from './fixtures';

test.describe('Calculator', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /Calculadora/ }).click();
    await expect(page.getByText('Calculadora')).toBeVisible();
  });

  test('shows default 500000 ARS in input', async ({ authenticatedPage: page }) => {
    const input = page.getByPlaceholder('500000');
    await expect(input).toHaveValue('500000');
  });

  test('ARS input calculates EUR cost', async ({ authenticatedPage: page }) => {
    const arsInput = page.getByPlaceholder('500000');
    await arsInput.fill('1000000');
    // EUR field should update (non-zero value)
    const eurInput = page.getByPlaceholder('0.00');
    await expect(eurInput).not.toHaveValue('0.00');
    await expect(eurInput).not.toHaveValue('');
  });

  test('EUR input calculates ARS result', async ({ authenticatedPage: page }) => {
    const eurInput = page.getByPlaceholder('0.00');
    await eurInput.click();
    await eurInput.fill('500');
    const arsInput = page.getByPlaceholder('500000');
    // ARS should update to a non-zero value
    await expect(arsInput).not.toHaveValue('0.00');
    await expect(arsInput).not.toHaveValue('');
  });

  test('shows breakdown table with all 5 rows', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Depósito SEPA')).toBeVisible();
    await expect(page.getByText(/EUR.*USDC/)).toBeVisible();
    await expect(page.getByText(/Fee trading/)).toBeVisible();
    await expect(page.getByText(/Retiro Binance/)).toBeVisible();
    await expect(page.getByText(/USDC destino/)).toBeVisible();
  });

  test('shows IBAN warning when IBAN not configured', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/Configurá tu IBAN de Binance/)).toBeVisible();
  });

  test('sin IBAN: muestra mensaje de configuración para el QR de pago', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Configurá tu IBAN de Binance en Ajustes para ver el QR de pago.')).toBeVisible();
  });

  test('"Ver datos para copiar" toggles SEPA details panel', async ({ authenticatedPage: page }) => {
    const toggleBtn = page.getByRole('button', { name: /Ver datos para copiar/ });
    await toggleBtn.click();
    await expect(page.getByText('Datos de transferencia SEPA')).toBeVisible();
    await toggleBtn.click();
    await expect(page.getByText('Datos de transferencia SEPA')).not.toBeVisible();
  });

  test('SEPA details panel shows IBAN when configured', async ({ authenticatedPage: page }) => {
    await page.evaluate(() => {
      localStorage.setItem('binance_eur_iban', 'LT96 3230 0000 0000 0001');
      localStorage.setItem('binance_eur_name', 'Binance Europe Services Ltd');
      localStorage.setItem('binance_eur_bic', 'REVOLT21XXX');
    });
    await page.reload();
    await page.getByRole('button', { name: /Calculadora/ }).click();
    await page.getByRole('button', { name: /Ver datos para copiar/ }).click();
    await expect(page.getByText('LT96 3230 0000 0000 0001')).toBeVisible();
    await expect(page.getByText('REVOLT21XXX')).toBeVisible();
  });

  test('back button returns to main menu', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /Cerrar/ }).click();
    await expect(page.getByRole('button', { name: /Calculadora/ })).toBeVisible();
    await expect(page.getByText('Bienvenido de vuelta,')).toBeVisible();
  });
});
