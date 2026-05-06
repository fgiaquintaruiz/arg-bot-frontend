import { test, expect } from './fixtures';

test.describe('Dashboard — authenticated', () => {
  test('shows live EUR/USDC rate from API', async ({ authenticatedPage: page }) => {
    // MOCK_API_DATA.rate = '1.0850'
    // Use exact match to scope to the rate strip <span>1.0850</span> only
    // and avoid matching wizard breakdown label "EUR→USDC (1.0850)"
    await expect(page.getByText('1.0850', { exact: true })).toBeVisible();
  });

  test('shows live USDC/ARS rate from API', async ({ authenticatedPage: page }) => {
    // MOCK_API_DATA.usdcArsRate = '1150.00' → rendered as "USDC destino (1150)" in wizard breakdown
    await expect(page.getByText(/USDC destino \(1150\)/)).toBeVisible();
  });

  test('shows trading wizard on load', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Simulación')).toBeVisible();
  });

  test('settings icon opens Settings modal', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: 'Abrir configuración' }).click();
    // Scope to the heading role to avoid matching breadcrumb "Configuración → Binance"
    await expect(page.getByRole('heading', { name: 'Configuración' })).toBeVisible();
    await expect(page.getByText('Sync')).toBeVisible();
  });

  test('Salir button is visible in header', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible();
  });

  test('version badge is shown in header', async ({ authenticatedPage: page }) => {
    await expect(page.getByText(/v\d+\.\d+\.\d+/)).toBeVisible();
  });

  // Novedades feature was removed from Dashboard UI (showUpdates is dead code — no trigger button).
  // Skipped until the feature is reinstated or the test is re-scoped to the Updates component directly.
  test.skip('Novedades modal opens from Dashboard', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /Novedades y Roadmap/ }).click();
    await expect(page.getByText('Novedades y Hoja de Ruta')).toBeVisible();
    await page.getByRole('button', { name: 'Cerrar novedades' }).click();
    await expect(page.getByText('Novedades y Hoja de Ruta')).not.toBeVisible();
  });
});

test.describe('Dashboard rate strip — responsive', () => {
  test('USDC/ARS item is fully visible on mobile (no horizontal overflow)', async ({ authenticatedPage: page }) => {
    // Fix regression: on mobile the strip overflowed to the left, clipping the
    // first chars of "USDC/ARS" (rendered as "SDC/ARS" or off-screen).
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('viewport size unavailable');

    const item = page.getByText(/USDC\/ARS/).first();
    await expect(item).toBeVisible();
    const box = await item.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
  });

  test('balance label and amount stay on the same line on mobile', async ({ authenticatedPage: page }) => {
    // Fix regression: "Disponible:" wrapped to its own line, splitting from
    // the EUR amount. The whole balance group must stay on one visual line.
    const balance = page.getByTestId('rate-strip-balance');
    await expect(balance).toBeVisible();

    const labelBox = await balance.getByText('Disponible:').boundingBox();
    const eurBox = await balance.getByText(/€/).boundingBox();
    expect(labelBox).not.toBeNull();
    expect(eurBox).not.toBeNull();

    // Same line ⇒ vertical centers within ~4px of each other.
    const labelCenter = labelBox!.y + labelBox!.height / 2;
    const eurCenter = eurBox!.y + eurBox!.height / 2;
    expect(Math.abs(labelCenter - eurCenter)).toBeLessThanOrEqual(4);
  });

  test('both EUR and USDC balances are visible inside the viewport on mobile', async ({ authenticatedPage: page }) => {
    // Fix regression: USDC balance was off-screen because the right-aligned
    // balance group was pushed beyond the viewport edge.
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('viewport size unavailable');

    const balance = page.getByTestId('rate-strip-balance');
    await expect(balance).toBeVisible();

    const box = await balance.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);

    // Both currency markers are present and visible.
    await expect(balance.getByText(/€/)).toBeVisible();
    await expect(balance.getByText(/USDC/)).toBeVisible();
  });

  test('rate items do not split internally on mobile (whitespace-nowrap)', async ({ authenticatedPage: page }) => {
    // Fix regression: "1 EUR = 1.745 ARS" wrapped internally between tokens.
    // Each rate item should render on a single line.
    const item = page.getByText(/1 EUR =/).first();
    await expect(item).toBeVisible();
    const box = await item.boundingBox();
    expect(box).not.toBeNull();
    // Single-line height for 12px font with default line-height stays under ~22px.
    // If the item wrapped into 2+ lines, height would be ~28px or more.
    expect(box!.height).toBeLessThanOrEqual(22);
  });
});

test.describe('TradingWizard — step 1: Heuro bank account checkbox', () => {
  test('SEPA block is visible by default at step 1 (no IBAN configured)', async ({ authenticatedPage: page }) => {
    // Default arsAmount = '500000' → displayedEur > 0 → Continuar is enabled
    await page.getByRole('button', { name: /Continuar con la transferencia/ }).click();
    // Step 1 content appears — without IBAN the fallback "no account" message shows
    await expect(page.getByText(/No tenés cuenta SEPA configurada/)).toBeVisible();
  });

  test('checking Heuro checkbox hides the SEPA data block', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /Continuar con la transferencia/ }).click();
    // SEPA block is initially visible
    await expect(page.getByText(/No tenés cuenta SEPA configurada/)).toBeVisible();
    // Check the Heuro checkbox
    const checkbox = page.getByRole('checkbox', { name: /Ya tengo mi cuenta de Heuro agendada en el banco/ });
    await checkbox.check();
    // SEPA block must disappear
    await expect(page.getByText(/No tenés cuenta SEPA configurada/)).not.toBeVisible();
  });

  test('unchecking Heuro checkbox restores the SEPA data block', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /Continuar con la transferencia/ }).click();
    const checkbox = page.getByRole('checkbox', { name: /Ya tengo mi cuenta de Heuro agendada en el banco/ });
    await checkbox.check();
    await expect(page.getByText(/No tenés cuenta SEPA configurada/)).not.toBeVisible();
    await checkbox.uncheck();
    await expect(page.getByText(/No tenés cuenta SEPA configurada/)).toBeVisible();
  });

  test('Heuro checkbox state persists to localStorage', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /Continuar con la transferencia/ }).click();
    const checkbox = page.getByRole('checkbox', { name: /Ya tengo mi cuenta de Heuro agendada en el banco/ });
    await checkbox.check();
    const stored = await page.evaluate(() => localStorage.getItem('bank_account_saved'));
    expect(stored).toBe('true');
  });
});

test.describe('TradingWizard — step 3: Withdraw testnet mock', () => {
  // Helper: navigate from step 0 to step 3 (Withdraw) using mocked API calls.
  // Pre-conditions (injected by authenticatedPage fixture):
  //   - argbot_testnet is absent → defaults to testnet mode
  //   - /api/trade is mocked to return success
  //   - address book is pre-seeded with one entry so Withdraw is enabled

  async function navigateToWithdrawStep(page: import('@playwright/test').Page) {
    // Seed address book so Withdraw button is enabled
    await page.evaluate(() => {
      const entry = { id: 'e2e-addr-1', name: 'Nexo E2E', address: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12' };
      localStorage.setItem('address_book', JSON.stringify([entry]));
      localStorage.setItem('usdc_wallet_id', 'e2e-addr-1');
    });
    // Mock the trade API so step 2 can succeed
    await page.route('**/api/trade', route => route.fulfill({ json: { success: true } }));
    // Step 0 → 1
    await page.getByRole('button', { name: /Continuar con la transferencia/ }).click();
    // Step 1 → 2: "Ya realicé la transferencia"
    await page.getByRole('button', { name: /Ya realicé la transferencia/ }).click();
    // Step 2: fill EUR amount and confirm via Trade component
    await page.getByPlaceholder('Monto en EUR').fill('100');
    await page.getByRole('button', { name: 'Ejecutar cambio' }).click();
    await page.getByRole('button', { name: 'Confirmar' }).click();
    // Wait for trade success message then auto-advance (2s timeout in component)
    await expect(page.getByText(/Cambio ejecutado con éxito/)).toBeVisible({ timeout: 10_000 });
    // Step 3 (Withdraw) appears after the 2s auto-advance
    await expect(page.getByText('Retirar USDC')).toBeVisible({ timeout: 5_000 });
  }

  test('testnet mode: initiating a withdraw shows TESTNET badge', async ({ authenticatedPage: page }) => {
    // argbot_testnet defaults to absent → isTestnet = true
    await navigateToWithdrawStep(page);
    // Initiate the withdrawal
    await page.getByRole('button', { name: 'Retirar' }).click();
    // Confirmation dialog appears
    await expect(page.getByRole('dialog', { name: 'Confirmar retiro' })).toBeVisible();
    await page.getByRole('checkbox', { name: /Entiendo que esta operación es irreversible/ }).check();
    await page.getByRole('button', { name: 'Confirmar retiro' }).click();
    // Testnet mock waits 1s then shows the badge
    await expect(page.getByText('TESTNET')).toBeVisible({ timeout: 5_000 });
  });

  test('testnet mode: success message mentions testnet simulation', async ({ authenticatedPage: page }) => {
    await navigateToWithdrawStep(page);
    await page.getByRole('button', { name: 'Retirar' }).click();
    await expect(page.getByRole('dialog', { name: 'Confirmar retiro' })).toBeVisible();
    await page.getByRole('checkbox', { name: /Entiendo que esta operación es irreversible/ }).check();
    await page.getByRole('button', { name: 'Confirmar retiro' }).click();
    await expect(page.getByText(/Simulación testnet/)).toBeVisible({ timeout: 5_000 });
  });

  test('testnet mode: confirmation dialog disappears after testnet mock completes', async ({ authenticatedPage: page }) => {
    await navigateToWithdrawStep(page);
    await page.getByRole('button', { name: 'Retirar' }).click();
    await page.getByRole('checkbox', { name: /Entiendo que esta operación es irreversible/ }).check();
    await page.getByRole('button', { name: 'Confirmar retiro' }).click();
    // Confirmation overlay must close after testnet mock
    await expect(page.getByRole('dialog', { name: 'Confirmar retiro' })).not.toBeVisible({ timeout: 5_000 });
  });
});

test.describe('TradingWizard — step 4: broker language (not Nexo/Ripio)', () => {
  async function navigateToStep4(page: import('@playwright/test').Page) {
    // Seed address book
    await page.evaluate(() => {
      const entry = { id: 'e2e-addr-1', name: 'Destino E2E', address: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12' };
      localStorage.setItem('address_book', JSON.stringify([entry]));
      localStorage.setItem('usdc_wallet_id', 'e2e-addr-1');
      // Disable testnet so Withdraw.onSuccess fires and step advances to 4
      localStorage.setItem('argbot_testnet', 'false');
    });
    await page.route('**/api/trade', route => route.fulfill({ json: { success: true } }));
    await page.route('**/api/withdraw', route => route.fulfill({ json: { success: true } }));
    await page.route('**/api/push/**', route => route.fulfill({ json: {} }));
    // Step 0 → 1
    await page.getByRole('button', { name: /Continuar con la transferencia/ }).click();
    // Step 1 → 2
    await page.getByRole('button', { name: /Ya realicé la transferencia/ }).click();
    // Step 2: Trade
    await page.getByPlaceholder('Monto en EUR').fill('100');
    await page.getByRole('button', { name: 'Ejecutar cambio' }).click();
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByText(/Cambio ejecutado con éxito/)).toBeVisible({ timeout: 10_000 });
    // Step 3: Withdraw
    await expect(page.getByText('Retirar USDC')).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: 'Retirar' }).click();
    await expect(page.getByRole('dialog', { name: 'Confirmar retiro' })).toBeVisible();
    await page.getByRole('checkbox', { name: /Entiendo que esta operación es irreversible/ }).check();
    await page.getByRole('button', { name: 'Confirmar retiro' }).click();
    // Production path shows "¡Solicitud de retiro enviada!" then advances after 2s
    await expect(page.getByText(/Solicitud de retiro enviada/)).toBeVisible({ timeout: 5_000 });
    // Step 4 (broker) appears after the 2s auto-advance
    await expect(page.getByText(/Convertir USDC → ARS en tu broker/)).toBeVisible({ timeout: 5_000 });
  }

  test('step 4 header uses "broker" label, not "Nexo" or "Ripio"', async ({ authenticatedPage: page }) => {
    await navigateToStep4(page);
    // The StepBadge for step 4 reads "5. Convertir USDC → ARS en tu broker"
    await expect(page.getByText(/Convertir USDC → ARS en tu broker/)).toBeVisible();
    // "Nexo" and "Ripio" must NOT appear as step labels
    await expect(page.getByText('Nexo', { exact: true })).not.toBeVisible();
    await expect(page.getByText('Ripio', { exact: true })).not.toBeVisible();
  });

  test('step 4 content uses "broker" terminology throughout', async ({ authenticatedPage: page }) => {
    await navigateToStep4(page);
    // Disclaimer text uses "broker"
    await expect(page.getByText(/Las comisiones del broker no están incluidas/)).toBeVisible();
    // CTA link says "broker cripto"
    await expect(page.getByText(/Abrir tu broker cripto en Argentina/)).toBeVisible();
  });

  test('step 4 content does not reference "Nexo" or "Ripio" by name', async ({ authenticatedPage: page }) => {
    await navigateToStep4(page);
    // Regression guard: old text used "Nexo" and "Ripio" specifically — now replaced with "broker"
    await expect(page.getByText(/Nexo/i)).not.toBeVisible();
    await expect(page.getByText(/en Ripio/i)).not.toBeVisible();
  });
});
