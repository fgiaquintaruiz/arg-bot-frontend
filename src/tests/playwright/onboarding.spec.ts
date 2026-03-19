import { test, expect } from '@playwright/test';
test('Final Check', async ({ page }) => {
  await page.goto('http://localhost:10007/');
  const content = await page.innerText('body');
  console.log("CONTENIDO REAL EN BROWSER:", content);
  await expect(page.locator('body')).toContainText('1.8.121');
});
