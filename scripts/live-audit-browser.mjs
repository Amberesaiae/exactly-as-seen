/**
 * Live browser audit — Flow A → B → C from scratch (hosted Supabase).
 * Usage: bun scripts/live-audit-browser.mjs [baseUrl]
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE = process.argv[2] || 'http://127.0.0.1:5173';
const TS = Date.now();
// Prefer pre-confirmed user (hosted projects often require email confirm)
const EMAIL = process.env.LIVE_AUDIT_EMAIL || `live.audit.${TS}@example.com`;
const PASS = process.env.LIVE_AUDIT_PASS || 'LiveAudit1!';
const FARM = `Live Audit Farm ${TS}`;
const USE_LOGIN = Boolean(process.env.LIVE_AUDIT_EMAIL);
const OUT = join(process.cwd(), 'docs', 'live-audit-artifacts');
mkdirSync(OUT, { recursive: true });

const findings = [];
const log = (step, ok, detail = '') => {
  const row = { step, ok, detail, at: new Date().toISOString() };
  findings.push(row);
  console.log(`${ok ? '✓' : '✗'} [${step}] ${detail}`);
};

async function shot(page, name) {
  const path = join(OUT, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function waitUrl(page, re, ms = 20000) {
  await page.waitForURL(re, { timeout: ms });
}

async function main() {
  console.log(`\n=== LIVE BROWSER AUDIT ===\nBase: ${BASE}\nEmail: ${EMAIL}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(25000);

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  try {
    // ── Landing ──────────────────────────────────────────────
    await page.goto(`${BASE}/welcome`, { waitUntil: 'domcontentloaded' });
    await shot(page, '01-welcome');
    const hasWelcome = await page.getByText(/LampFarms|ledger|farm/i).first().isVisible().catch(() => false);
    log('A0 landing /welcome', hasWelcome, hasWelcome ? 'welcome visible' : 'landing missing content');

    // ── Auth (register or login with pre-confirmed admin user) ──
    if (USE_LOGIN) {
      await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
      await shot(page, '02-login');
      await page.getByLabel(/^email/i).fill(EMAIL);
      await page.locator('input[type="password"]').first().fill(PASS);
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();
      await page.waitForTimeout(4000);
      await shot(page, '03-after-login');
      const urlAfter = page.url();
      const ok = /farm-setup|dashboard/.test(urlAfter);
      log('A1 login → session', ok, `landed ${urlAfter} (pre-confirmed user; hosted email-confirm bypass)`);
      if (!ok) throw new Error('LOGIN_FAILED');
    } else {
      await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded' });
      await shot(page, '02-register');
      await page.getByLabel(/full name/i).fill('Live Audit Farmer');
      await page.getByLabel(/^email/i).fill(EMAIL);
      await page.locator('input[type="password"]').first().fill(PASS);
      const farmOnReg = page.getByLabel(/farm name/i);
      if (await farmOnReg.count()) await farmOnReg.fill(FARM);
      await page.getByRole('button', { name: 'Create Account', exact: true }).click();
      await page.waitForTimeout(3000);
      await shot(page, '03-after-register');
      const urlAfterReg = page.url();
      const onSetup = /farm-setup/.test(urlAfterReg);
      const onDash = /dashboard/.test(urlAfterReg);
      const stillReg = /register/.test(urlAfterReg);
      const bodyText = await page.locator('body').innerText().catch(() => '');

      if (onSetup || onDash) {
        log('A1 register → session', true, `landed ${urlAfterReg}`);
      } else if (stillReg && /confirm|verify|email/i.test(bodyText)) {
        log('A1 register → session', false, 'Email confirmation required — set LIVE_AUDIT_EMAIL via admin createUser');
        throw new Error('EMAIL_CONFIRM_REQUIRED');
      } else if (stillReg) {
        log('A1 register → session', false, `still on register: ${bodyText.slice(0, 200)}`);
        throw new Error('REGISTER_FAILED');
      } else {
        log('A1 register → session', false, `unexpected URL ${urlAfterReg}`);
      }
    }

    const urlAfterAuth = page.url();
    const onSetup = /farm-setup/.test(urlAfterAuth);
    const onDash = /dashboard/.test(urlAfterAuth);

    // ── Farm setup ───────────────────────────────────────────
    if (!onDash) {
      if (!onSetup) await page.goto(`${BASE}/farm-setup`, { waitUntil: 'domcontentloaded' });
      // Wait for farm row bootstrap (OAuth / admin-created users)
      await page.waitForTimeout(1500);
      await shot(page, '04-farm-setup-1');

      const nameInput = page.locator('#farmNameSetup');
      await nameInput.waitFor({ state: 'visible', timeout: 15000 });
      await nameInput.fill(FARM);

      await page.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(600);
      await shot(page, '05-farm-setup-2');

      // Step 2 houses — defaults ok
      await page.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(600);
      await shot(page, '06-farm-setup-3');

      // Step 3 finish — wait until enabled (farmId ready)
      const finish = page.getByRole('button', { name: /finish/i });
      await finish.waitFor({ state: 'visible' });
      for (let i = 0; i < 20; i++) {
        if (await finish.isEnabled()) break;
        await page.waitForTimeout(250);
      }
      await finish.click();
      try {
        await page.waitForURL(/dashboard/, { timeout: 25000 });
        log('A2 farm setup complete', true, page.url());
      } catch {
        await shot(page, '07-after-farm-setup');
        log('A2 farm setup complete', false, page.url());
        // Do not force-bypass incomplete setup — that breaks house/batch
        throw new Error('FARM_SETUP_STUCK');
      }
      await shot(page, '07-after-farm-setup');
    }

    await shot(page, '08-dashboard');
    const dashOk = /dashboard/.test(page.url());
    log('A3 dashboard gate', dashOk, page.url());

    // ── Flow B: create batch (2-step wizard) ─────────────────
    await page.goto(`${BASE}/batches/new`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await shot(page, '09-batch-create');
    const batchName = `Broiler Live ${TS}`;

    await page.locator('#name').fill(batchName);
    // House should auto-select if available
    const noHouse = await page.getByText(/no available houses/i).count();
    if (noHouse) {
      log('B1 create batch', false, 'No available houses — farm setup incomplete');
      throw new Error('NO_HOUSES');
    }

    await page.getByRole('button', { name: /next step/i }).click();
    await page.waitForTimeout(800);
    await shot(page, '09b-batch-step2');

    const qty = page.locator('#initialQuantity, input[type="number"]').first();
    if (await qty.count()) await qty.fill('100');

    const createBtn = page.getByRole('button', { name: /create|register|start flock|finish|save flock/i });
    await createBtn.first().click();
    try {
      await page.waitForURL(/\/batches\/[0-9a-f-]{8,}/i, { timeout: 25000 });
      log('B1 create batch', true, page.url());
    } catch {
      await shot(page, '10-after-batch-create');
      log('B1 create batch', false, page.url());
      throw new Error('BATCH_CREATE_FAILED');
    }
    await shot(page, '10-after-batch-create');

    // Health — expect vaccinations or tasks without Generate if seeded
    await page.goto(`${BASE}/health`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await shot(page, '11-health');
    const healthText = await page.locator('body').innerText();
    const hasVaxUi = /vaccin|schedule|care|task|health|medication/i.test(healthText);
    log('B2 health page loads', hasVaxUi, hasVaxUi ? 'health UI present' : 'health empty/error');

    // ── Flow C: Feed today ───────────────────────────────────
    await page.goto(`${BASE}/feed`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await shot(page, '12-feed');
    const feedText = await page.locator('body').innerText();
    const hasFeedTool = /Today.?s Feeding|Confirm Feeding|Feeding Complete|No active batches/i.test(feedText);
    const canConfirm = await page.getByRole('button', { name: /Confirm Feeding/i }).count();
    log('C1 feed page', hasFeedTool, canConfirm ? 'Confirm CTA visible' : (feedText.includes('Complete') ? 'already complete or no task' : feedText.slice(0, 120)));

    if (canConfirm > 0) {
      await page.getByRole('button', { name: /Confirm Feeding/i }).click();
      await page.waitForTimeout(3000);
      await shot(page, '13-feed-confirmed');
      const afterFeed = await page.locator('body').innerText();
      log('C2 confirm feed', /complete|logged|confirmed|deducted/i.test(afterFeed), afterFeed.slice(0, 150));
    } else {
      log('C2 confirm feed', false, 'No Confirm Feeding button — inspect 12-feed.png');
    }

    // Water / health hydration
    await page.goto(`${BASE}/health`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const waterTab = page.getByRole('tab', { name: /water/i });
    if (await waterTab.count()) {
      await waterTab.click();
      await page.waitForTimeout(1000);
      await shot(page, '14-water-tab');
      log('C3 water tab', true, 'opened');
    } else {
      // tabs may use different labels
      const alt = page.getByText(/^water$/i);
      if (await alt.count()) {
        await alt.first().click();
        await shot(page, '14-water-tab');
        log('C3 water tab', true, 'opened via text');
      } else {
        log('C3 water tab', false, 'no Water tab');
      }
    }

    // Stock / Finance smoke
    for (const [path, label] of [
      ['/stock', 'F stock'],
      ['/finance', 'K finance'],
      ['/eggs', 'G eggs'],
    ]) {
      await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      const name = path.replace('/', '');
      await shot(page, `15-${name}`);
      const t = await page.locator('body').innerText();
      const broken = /something went wrong|error boundary|failed to fetch|Missing VITE_/i.test(t);
      log(`${label} page smoke`, !broken, broken ? t.slice(0, 120) : 'ok');
    }

  } catch (e) {
    log('FATAL', false, String(e.message || e));
    await shot(page, '99-fatal').catch(() => {});
  } finally {
    const report = {
      base: BASE,
      email: EMAIL,
      findings,
      consoleErrors: consoleErrors.slice(0, 40),
      passed: findings.filter((f) => f.ok).length,
      failed: findings.filter((f) => !f.ok).length,
    };
    writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    writeFileSync(
      join(OUT, 'REPORT.md'),
      [
        '# Live browser audit report',
        '',
        `**When:** ${new Date().toISOString()}`,
        `**Base:** ${BASE}`,
        `**User:** ${EMAIL}`,
        `**Pass/Fail:** ${report.passed} / ${report.failed}`,
        '',
        '## Steps',
        ...findings.map((f) => `- ${f.ok ? '✅' : '❌'} **${f.step}** — ${f.detail}`),
        '',
        '## Console errors (sample)',
        ...(consoleErrors.length ? consoleErrors.slice(0, 20).map((e) => `- \`${e.slice(0, 200)}\``) : ['- (none captured)']),
        '',
        '## Artifacts',
        `- Screenshots: \`${OUT}/*.png\``,
        `- JSON: \`${join(OUT, 'report.json')}\``,
      ].join('\n')
    );
    console.log(`\n=== DONE pass=${report.passed} fail=${report.failed} ===`);
    console.log(`Report: ${join(OUT, 'REPORT.md')}`);
    await browser.close();
    process.exit(report.failed > 0 ? 1 : 0);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
