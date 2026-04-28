import { test, expect } from './fixtures/index';
import type { Page, TestInfo } from '@playwright/test';

interface CSPViolation {
  directive: string;
  blockedURI: string;
  route: string;
  source: 'console' | 'event';
  message: string;
}

interface RawEventViolation {
  directive: string;
  blockedURI: string;
  message: string;
}

const CSP_REGEX =
  /Content-Security-Policy|Refused to (load|connect|frame|execute|apply)|violates the following Content Security Policy/i;

const isCSPMessage = (text: string): boolean => CSP_REGEX.test(text);

async function setupCapture(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __CSP_VIOLATIONS__: RawEventViolation[] }).__CSP_VIOLATIONS__ = [];
    window.addEventListener('securitypolicyviolation', (e: SecurityPolicyViolationEvent) => {
      (window as unknown as { __CSP_VIOLATIONS__: RawEventViolation[] }).__CSP_VIOLATIONS__.push({
        directive: e.violatedDirective,
        blockedURI: e.blockedURI,
        message: `${e.violatedDirective} blocked ${e.blockedURI}`,
      });
    });
  });
}

async function collectEventViolations(page: Page, route: string): Promise<CSPViolation[]> {
  const raw = await page.evaluate(() => {
    const w = window as unknown as { __CSP_VIOLATIONS__: RawEventViolation[] };
    const items = w.__CSP_VIOLATIONS__ || [];
    w.__CSP_VIOLATIONS__ = [];
    return items;
  });
  return raw.map((v) => ({
    directive: v.directive,
    blockedURI: v.blockedURI,
    message: v.message,
    route,
    source: 'event' as const,
  }));
}

function deduplicate(violations: CSPViolation[]): CSPViolation[] {
  const seen = new Set<string>();
  const result: CSPViolation[] = [];
  for (const v of violations) {
    const key = `${v.directive}|${v.blockedURI}|${v.source}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(v);
    }
  }
  return result;
}

function renderMarkdown(violations: CSPViolation[]): string {
  if (violations.length === 0) {
    return '# CSP Violations\n\nNo violations captured.\n';
  }
  const header = '| directive | blockedURI | route | source | message |\n|---|---|---|---|---|';
  const rows = violations.map(
    (v) =>
      `| ${v.directive} | ${v.blockedURI || '(empty)'} | ${v.route} | ${v.source} | ${v.message.replace(/\|/g, '\\|')} |`,
  );
  return `# CSP Violations (${violations.length})\n\n${header}\n${rows.join('\n')}\n`;
}

function attachConsoleListener(page: Page, violations: CSPViolation[], getRoute: () => string): void {
  page.on('console', (msg) => {
    const text = msg.text();
    if (isCSPMessage(text)) {
      violations.push({
        directive: '(from-console)',
        blockedURI: '(from-console)',
        route: getRoute(),
        source: 'console',
        message: text,
      });
    }
  });
  page.on('pageerror', (err) => {
    if (isCSPMessage(err.message)) {
      violations.push({
        directive: '(pageerror)',
        blockedURI: '(pageerror)',
        route: getRoute(),
        source: 'console',
        message: err.message,
      });
    }
  });
}

async function safeClick(page: Page, name: RegExp | string): Promise<boolean> {
  try {
    const locator = page.getByRole('button', { name: name as RegExp });
    await locator.first().click({ timeout: 2_000 });
    return true;
  } catch {
    return false;
  }
}

async function reportViolations(
  testInfo: TestInfo,
  violations: CSPViolation[],
  label: string,
): Promise<void> {
  const deduped = deduplicate(violations);
  const md = renderMarkdown(deduped);
  await testInfo.attach('csp-violations.md', { body: md, contentType: 'text/markdown' });
  // eslint-disable-next-line no-console
  console.log(`\n=== CSP VIOLATIONS [${label}] count=${deduped.length} ===`);
  for (const v of deduped) {
    // eslint-disable-next-line no-console
    console.log(`[CSP] route=${v.route} source=${v.source} directive=${v.directive} blockedURI=${v.blockedURI} message=${v.message}`);
  }
  // eslint-disable-next-line no-console
  console.log(`=== END CSP VIOLATIONS [${label}] ===\n`);
}

test.describe('CSP report-only violations', () => {
  test('public routes (login + modales)', async ({ page }, testInfo) => {
    const violations: CSPViolation[] = [];
    let currentRoute = '/';
    attachConsoleListener(page, violations, () => currentRoute);
    await setupCapture(page);

    currentRoute = '/ (login)';
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const cspMeta = await page
      .locator('meta[http-equiv="Content-Security-Policy-Report-Only"]')
      .getAttribute('content')
      .catch(() => null);
    // eslint-disable-next-line no-console
    console.log(`[CSP-meta-detected] ${cspMeta ? 'YES' : 'NO'} length=${cspMeta?.length ?? 0}`);
    violations.push(...(await collectEventViolations(page, currentRoute)));

    currentRoute = '/ + Novedades modal';
    if (await safeClick(page, /Novedades y Roadmap/)) {
      await page.waitForLoadState('networkidle');
      violations.push(...(await collectEventViolations(page, currentRoute)));
      await safeClick(page, 'Cerrar novedades');
    }

    currentRoute = '/ + Términos modal';
    if (await safeClick(page, /Términos y Condiciones/)) {
      await page.waitForLoadState('networkidle');
      violations.push(...(await collectEventViolations(page, currentRoute)));
      await safeClick(page, 'Cerrar modal legal');
    }

    currentRoute = '/ + Privacidad modal';
    if (await safeClick(page, /Políticas de Privacidad/)) {
      await page.waitForLoadState('networkidle');
      violations.push(...(await collectEventViolations(page, currentRoute)));
      await safeClick(page, 'Cerrar modal legal');
    }

    await reportViolations(testInfo, violations, 'public');
    expect(true).toBe(true);
  });

  test('authenticated dashboard', async ({ authenticatedPage }, testInfo) => {
    const violations: CSPViolation[] = [];
    let currentRoute = '/ (dashboard)';
    attachConsoleListener(authenticatedPage, violations, () => currentRoute);
    await setupCapture(authenticatedPage);
    violations.push(...(await collectEventViolations(authenticatedPage, currentRoute)));

    currentRoute = '/ + Settings modal';
    if (await safeClick(authenticatedPage, 'Abrir configuración')) {
      await authenticatedPage.waitForLoadState('networkidle');
      violations.push(...(await collectEventViolations(authenticatedPage, currentRoute)));
      (await safeClick(authenticatedPage, /Cerrar configuración/)) || (await safeClick(authenticatedPage, /Cerrar/));
    }

    currentRoute = '/ + Novedades modal';
    if (await safeClick(authenticatedPage, /Novedades y Roadmap/)) {
      await authenticatedPage.waitForLoadState('networkidle');
      violations.push(...(await collectEventViolations(authenticatedPage, currentRoute)));
      await safeClick(authenticatedPage, 'Cerrar novedades');
    }

    await reportViolations(testInfo, violations, 'authenticated');
    expect(true).toBe(true);
  });
});
