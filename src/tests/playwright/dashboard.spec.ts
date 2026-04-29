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
