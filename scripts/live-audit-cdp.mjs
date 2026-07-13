/**
 * Live audit via Chrome DevTools Protocol (CDP).
 *
 * 1) Start Windows Chrome with remote debugging (or Chromium):
 *    chrome.exe --remote-debugging-port=9222 --user-data-dir=%TEMP%\\lampfarms-cdp
 * 2) Ensure Vite: bun run dev -- --host 127.0.0.1 --port 5173
 * 3) bun scripts/live-audit-cdp.mjs
 *
 * Env: LIVE_AUDIT_EMAIL, LIVE_AUDIT_PASS (pre-confirmed user)
 *      CDP_URL default http://127.0.0.1:9222
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';

const BASE = process.env.LIVE_AUDIT_BASE || 'http://127.0.0.1:5173';
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';
const EMAIL = process.env.LIVE_AUDIT_EMAIL;
const PASS = process.env.LIVE_AUDIT_PASS || 'LiveAudit1!';
const TS = Date.now();
const FARM = `CDP Farm ${TS}`;
const OUT = join(process.cwd(), 'docs', 'live-audit-artifacts', 'cdp');
mkdirSync(OUT, { recursive: true });

const findings = [];
const log = (step, ok, detail = '') => {
  findings.push({ step, ok, detail, at: new Date().toISOString() });
  console.log(`${ok ? '✓' : '✗'} [${step}] ${detail}`);
};

async function cdpUp() {
  try {
    const r = await fetch(`${CDP}/json/version`);
    return r.ok;
  } catch {
    return false;
  }
}

async function launchWindowsChrome() {
  // Prefer the fixed .cmd launcher (empty start title — required by cmd.exe)
  const cmdPath = join(process.cwd(), 'scripts', 'start-chrome-cdp.cmd');
  try {
    spawn('cmd.exe', ['/c', cmdPath.replace(/\//g, '\\')], {
      detached: true,
      stdio: 'ignore',
      cwd: process.cwd(),
    }).unref();
  } catch {
    // Fallback: start "" "chrome.exe" args...
    const chrome =
      process.env.CHROME_PATH ||
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const userData =
      process.env.CHROME_USER_DATA ||
      `${process.env.TEMP || 'C:\\Temp'}\\lampfarms-cdp-profile`;
    spawn(
      'cmd.exe',
      [
        '/c',
        'start',
        '""',
        chrome,
        '--remote-debugging-port=9222',
        `--user-data-dir=${userData}`,
        '--no-first-run',
        '--no-default-browser-check',
        BASE + '/welcome',
      ],
      { detached: true, stdio: 'ignore' }
    ).unref();
  }
  for (let i = 0; i < 30; i++) {
    if (await cdpUp()) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  if (!EMAIL) {
    console.error('Set LIVE_AUDIT_EMAIL (and optional LIVE_AUDIT_PASS) to a confirmed user.');
    process.exit(2);
  }

  console.log(`\n=== CDP LIVE AUDIT (Chrome DevTools Protocol) ===\nCDP: ${CDP}\nBase: ${BASE}\nUser: ${EMAIL}\n`);

  if (!(await cdpUp())) {
    console.log('CDP not up — launching Windows Chrome with --remote-debugging-port=9222 …');
    const ok = await launchWindowsChrome();
    if (!ok) {
      console.error(
        'Could not reach CDP on ' +
          CDP +
          '.\n\n' +
          'From Windows (not WSL), double-click or run:\n' +
          '  scripts\\start-chrome-cdp.cmd\n\n' +
          'Or manually (note empty quotes after start):\n' +
          '  start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222 --user-data-dir=%TEMP%\\lampfarms-cdp http://127.0.0.1:5173\n\n' +
          'Confirm CDP: open http://127.0.0.1:9222/json/version in a browser, then re-run this script from Windows if WSL cannot reach the port.'
      );
      process.exit(3);
    }
  }

  // Playwright speaks CDP — this is the same protocol as Chrome DevTools
  const browser = await chromium.connectOverCDP(CDP);
  const context = browser.contexts()[0] || (await browser.newContext());
  const page = context.pages()[0] || (await context.newPage());
  page.setDefaultTimeout(30000);

  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  const shot = async (name) => {
    const p = join(OUT, `${name}.png`);
    await page.screenshot({ path: p, fullPage: true }).catch(() => {});
    return p;
  };

  try {
    await page.goto(BASE + '/welcome', { waitUntil: 'domcontentloaded' });
    await shot('01-welcome');
    log('CDP0 attach + welcome', true, page.url());

    // Network: capture failed API calls for DevTools-style audit
    const failedApi = [];
    page.on('response', async (res) => {
      const u = res.url();
      if (u.includes('supabase.co') && res.status() >= 400) {
        failedApi.push({ url: u, status: res.status() });
      }
    });

    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/^email/i).fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASS);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await page.waitForTimeout(3500);
    await shot('02-after-login');
    const afterLogin = page.url();
    log('A1 login', /farm-setup|dashboard/.test(afterLogin), afterLogin);

    if (/farm-setup/.test(afterLogin)) {
      await page.waitForTimeout(1500);
      await page.locator('#farmNameSetup').fill(FARM);
      await page.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: /next/i }).click();
      await page.waitForTimeout(500);
      const finish = page.getByRole('button', { name: /finish/i });
      for (let i = 0; i < 20; i++) {
        if (await finish.isEnabled()) break;
        await page.waitForTimeout(250);
      }
      await finish.click();
      await page.waitForURL(/dashboard/, { timeout: 25000 });
      log('A2 farm setup', true, page.url());
    } else {
      log('A2 farm setup', true, 'already complete');
    }
    await shot('03-dashboard');

    // Batch create
    await page.goto(BASE + '/batches/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await page.locator('#name').fill(`CDP Broiler ${TS}`);
    if (await page.getByText(/no available houses/i).count()) {
      log('B1 create batch', false, 'no houses');
    } else {
      await page.getByRole('button', { name: /next step/i }).click();
      await page.waitForTimeout(600);
      await page.getByRole('button', { name: /create flock/i }).click();
      await page.waitForURL(/\/batches\/[0-9a-f-]{8,}/i, { timeout: 25000 });
      log('B1 create batch', true, page.url());
    }
    await shot('04-batch');

    // Health + Feed
    await page.goto(BASE + '/health', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await shot('05-health');
    log('B2 health', true, 'loaded');

    await page.goto(BASE + '/feed', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await shot('06-feed');
    const confirm = page.getByRole('button', { name: /Confirm Feeding/i });
    if (await confirm.count()) {
      await confirm.click();
      await page.waitForTimeout(2500);
      await shot('07-feed-confirm');
      log('C2 confirm feed', true, 'clicked');
    } else {
      log('C2 confirm feed', false, 'no CTA (maybe already logged or no batch)');
    }

    // Performance panel: failed API
    const apiOk = failedApi.length === 0;
    log('CDP network (supabase 4xx/5xx)', apiOk, apiOk ? 'none' : JSON.stringify(failedApi.slice(0, 8)));

  } catch (e) {
    log('FATAL', false, String(e.message || e));
    await shot('99-fatal');
  } finally {
    const report = {
      mode: 'chrome-devtools-protocol',
      cdp: CDP,
      base: BASE,
      email: EMAIL,
      findings,
      consoleErrors: consoleErrors.slice(0, 30),
      passed: findings.filter((f) => f.ok).length,
      failed: findings.filter((f) => !f.ok).length,
    };
    writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    writeFileSync(
      join(OUT, 'REPORT.md'),
      [
        '# CDP / Chrome DevTools Protocol live audit',
        '',
        `**Pass/Fail:** ${report.passed} / ${report.failed}`,
        `**CDP:** ${CDP}`,
        `**User:** ${EMAIL}`,
        '',
        ...findings.map((f) => `- ${f.ok ? '✅' : '❌'} **${f.step}** — ${f.detail}`),
        '',
        '## Console errors',
        ...(consoleErrors.length ? consoleErrors.slice(0, 15).map((e) => `- \`${e.slice(0, 180)}\``) : ['- none']),
        '',
        'Screenshots in this folder.',
      ].join('\n')
    );
    console.log(`\n=== CDP DONE pass=${report.passed} fail=${report.failed} ===`);
    console.log(`Report: ${join(OUT, 'REPORT.md')}`);
    // Do not close browser — user may be watching Chrome window
    process.exit(report.failed > 0 ? 1 : 0);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
