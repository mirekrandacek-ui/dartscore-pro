// iOS WebKit and Chromium regression: all digits must fit within their
// clickable button and the visible keypad, including Cricket's 7 columns.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { webkit, chromium } from 'playwright';

const base = process.env.DARTSCORE_UI_URL || 'http://127.0.0.1:4173/';
const output = 'build/ios-keypad-evidence';
mkdirSync(output, { recursive: true });
const cases = [
  { label: 'X01', mode: 'classic', expected: 23 },
  { label: 'Cricket', mode: 'cricket', expected: 8 },
  { label: 'Around the Clock', mode: 'around', expected: 22 },
];
const results = [];

try {
  for (const [engine, browserType] of Object.entries({ webkit, chromium })) {
    const browser = await browserType.launch();
    try {
      for (const width of [320, 360, 375, 390, 393, 430]) {
        for (const height of [667, 844]) {
        for (const mode of cases) {
          const context = await browser.newContext({
            viewport: { width, height },
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true,
            locale: 'en-US',
            userAgent: engine === 'webkit'
              ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
              : 'Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36'
          });
          const page = await context.newPage();
          page.setDefaultTimeout(20000);
          const runtimeErrors = [];
          page.on('pageerror', error => runtimeErrors.push(String(error)));
          try {
            await page.goto(base, { waitUntil: 'domcontentloaded' });
            await page.locator('.lobbyWrap').waitFor();
            if (mode.mode !== 'classic') {
              await page.locator('.lobbyModeGroup .themedSelectTrigger').click();
              await page.getByRole('option', { name: mode.label, exact: true }).click();
            }
            await page.locator('.lobbyWrap .btn.green').first().click();
            const scope = page.locator('.container[data-screen="game"][data-mode="' + mode.mode + '"]');
            await scope.locator('.padPane.dartKeypad .key').first().waitFor();
            const geometry = await page.evaluate(() => {
              const pane = document.querySelector('.container[data-screen="game"] .padPane.dartKeypad');
              const pad = pane.getBoundingClientRect();
              const issues = [];
              const keys = [...pane.querySelectorAll('button.key')];
              for (const el of keys) {
                const key = el.getBoundingClientRect();
                const range = document.createRange();
                range.selectNodeContents(el);
                const glyph = range.getBoundingClientRect();
                const label = el.textContent.trim();
                const fontSize = parseFloat(getComputedStyle(el).fontSize);
                const leftGap = glyph.left - key.left;
                const rightGap = key.right - glyph.right;
                if (label.length > 1 && (leftGap < 3 || rightGap < 3)) {
                  issues.push({ label, kind: 'no-inner-edge-clearance', leftGap, rightGap, fontSize });
                }
                if (label.length > 1 && glyph.width / key.width < 0.61) {
                  issues.push({ label, kind: 'text-too-small-for-button', ratio: glyph.width / key.width, fontSize });
                }
                if (key.left < pad.left - 1 || key.right > pad.right + 1) {
                  issues.push({ label, kind: 'button-outside-keypad', left: key.left, right: key.right, paneLeft: pad.left, paneRight: pad.right });
                }
                if (glyph.left < key.left - 1 || glyph.right > key.right + 1) {
                  issues.push({ label, kind: 'digit-cropped', glyphLeft: glyph.left, glyphRight: glyph.right, keyLeft: key.left, keyRight: key.right });
                }
                if (el.scrollWidth > el.clientWidth + 1) {
                  issues.push({ label, kind: 'button-scroll-overflow', scrollWidth: el.scrollWidth, clientWidth: el.clientWidth });
                }
              }
              const viewportWidth = document.documentElement.clientWidth;
              if (pad.left < -1 || pad.right > viewportWidth + 1) {
                issues.push({ kind: 'pad-outside-viewport', left: pad.left, right: pad.right, viewportWidth });
              }
              return { keyCount: keys.length, viewportWidth, paneWidth: pad.width, issues };
            });
            results.push({ engine, width, height, mode: mode.mode, ...geometry });
            await page.screenshot({ path: output + '/' + engine + '-' + width + 'x' + height + '-' + mode.mode + '.png' });
            assert.equal(geometry.keyCount, mode.expected, 'Missing buttons in ' + mode.mode);
            assert.deepEqual(geometry.issues, [], engine + '/' + width + 'x' + height + '/' + mode.mode + ' clipped digits');
            assert.deepEqual(runtimeErrors, [], 'Unexpected page errors');
            console.log('PASS', engine, width, height, mode.mode, 'large labels safely inside unchanged buttons');
          } finally {
            await context.close();
          }
        }
        }
      }
    } finally {
      await browser.close();
    }
  }
} finally {
  writeFileSync(output + '/measurements.json', JSON.stringify(results, null, 2));
}
