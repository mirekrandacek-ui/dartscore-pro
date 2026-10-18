// Runs in real WebKit (the rendering engine behind iOS WKWebView).
// This is a UI regression test, not proof that AVSpeechSynthesizer produces sound.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { webkit } from 'playwright';

const output = 'build/mobile-ui-evidence';
mkdirSync(output, { recursive: true });
const base = process.env.DARTSCORE_UI_URL || 'http://127.0.0.1:4173/';
const results = [];
const widths = [320, 375, 390, 430];
const selectors = [
  '.container', '.header', '.lobbyWrap', '.lobbyCard', '.lobbyControls',
  '.playerRow', '.gameWrap', '.gameTopBar', '.playersPane',
  '.playerCard', '.playerScore', '.playerTurn', '.padPane', '.multBtn', '.key'
];

async function assertWidth(page, stage, width) {
  const data = await page.evaluate((selectors) => {
    const vw = document.documentElement.clientWidth;
    const rootWidth = document.documentElement.scrollWidth;
    const elements = selectors.flatMap(selector => [...document.querySelectorAll(selector)].map(el => {
      const r = el.getBoundingClientRect();
      return { selector, left: r.left, right: r.right, width: r.width,
        text: (el.textContent || '').trim().slice(0, 30) };
    }).filter(x => x.width > 1));
    return { vw, rootWidth, offending: elements.filter(x => x.left < -2 || x.right > vw + 2) };
  }, selectors);
  results.push({ stage, width, ...data });
  assert.ok(data.rootWidth <= data.vw + 2,
    stage + '/' + width + ': document scrolls horizontally: ' + JSON.stringify(data));
  assert.deepEqual(data.offending, [],
    stage + '/' + width + ': controls extend past screen: ' + JSON.stringify(data.offending.slice(0, 12)));
}

const browser = await webkit.launch({ headless: true });
try {
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(String(err)));
    try {
      await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.locator('.lobbyWrap .lobbyCard').first().waitFor();
      await assertWidth(page, 'lobby', width);
      await page.screenshot({ path: path.join(output, 'lobby-' + width + '.png') });

      const start = page.locator('.lobbyWrap .btn.green').first();
      await start.click();
      await page.locator('.container[data-screen="game"] .padPane button.key').first().waitFor();
      await assertWidth(page, 'x01', width);
      await page.screenshot({ path: path.join(output, 'x01-' + width + '.png') });

      const scoreBefore = await page.locator('.classicAroundPane .playerCard').first().locator('.playerScore').innerText();
      for (let i = 0; i < 3; ++i) {
        await page.locator('.padPane button.key').filter({ hasText: /^1$/ }).click();
      }
      const scoreAfter = await page.locator('.classicAroundPane .playerCard').first().locator('.playerScore').innerText();
      assert.notEqual(scoreBefore, scoreAfter, 'X01 score must change after 3 darts');
      await assertWidth(page, 'x01-after-three-darts', width);
      await page.screenshot({ path: path.join(output, 'x01-scored-' + width + '.png') });
      assert.deepEqual(pageErrors, [], 'Page JavaScript errors: ' + pageErrors.join('; '));
    } catch (e) {
      await page.screenshot({ path: path.join(output, 'failed-' + width + '.png') }).catch(() => {});
      throw e;
    } finally {
      await context.close();
    }
    console.log('PASS WebKit iPhone width ' + width + ': lobby, X01, scoring, and horizontal bounds');
  }

  // The native Android app and TWA must not render SEO copy between rules and statistics.
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'
  });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.locator('.lobbyWrap').waitFor();
  assert.equal(await page.locator('.webPublisherContent').count(), 0,
    'Android app-like environment must hide public web SEO text');
  await assertWidth(page, 'android-lobby-copy', 390);
  await context.close();
  console.log('PASS Android-like user agent does not show web-only promotional text');
} finally {
  await browser.close();
  writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
}
