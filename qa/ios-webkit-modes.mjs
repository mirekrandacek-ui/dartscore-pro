// Exercise all non-X01 modes in WebKit with touch emulation, not just X01.
// Cricket player columns intentionally scroll *inside* .cricketScroll.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { webkit } from 'playwright';

const output = 'build/mobile-ui-evidence';
mkdirSync(output, { recursive: true });
const base = process.env.DARTSCORE_UI_URL || 'http://127.0.0.1:4173/';
const modes = [
  { label: 'Cricket', value: 'cricket', target: '.cricketWrap' },
  { label: 'Around the Clock', value: 'around', target: '.classicAroundPane' },
  { label: 'Roulette', value: 'roulette', target: '.roulettePane' },
  { label: 'Roulette Double', value: 'rouletteDouble', target: '.roulettePane' }
];
const results = [];
const browser = await webkit.launch({ headless: true });
try {
  for (const width of [320, 390]) {
    for (const mode of modes) {
      const ctx = await browser.newContext({
        viewport: { width, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1'
      });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      try {
        await page.goto(base, { waitUntil: 'domcontentloaded' });
        await page.locator('.lobbyModeGroup .themedSelectTrigger').click();
        await page.getByRole('option', { name: mode.label, exact: true }).click();
        await page.locator('.lobbyWrap .btn.green').first().click();
        await page.locator('.container[data-screen="game"][data-mode="' + mode.value + '"]').waitFor();
        await page.locator(mode.target).waitFor();

        const measure = await page.evaluate(({ mode, target }) => {
          const docWidth = document.documentElement.clientWidth;
          const rootWidth = document.documentElement.scrollWidth;
          const scope = document.querySelector('.container[data-screen="game"]');
          const selectors = ['.container', '.header', '.gameWrap', '.gameTopBar', '.playersPane',
            target, '.padPane', '.padRow', '.multBtn', '.key', '.roulettePane .playerCard', '.cricketWrap .targetsRail',
            '.cricketWrap .cricketScroll'];
          const overflows = selectors.flatMap(selector =>
            [...document.querySelectorAll(selector)].map(el => {
              const r = el.getBoundingClientRect();
              return { selector, left: r.left, right: r.right, width: r.width };
            }).filter(r => r.width > 1 && (r.left < -2 || r.right > docWidth + 2))
          );
          return { mode, docWidth, rootWidth, overflows, scopeWidth: scope?.getBoundingClientRect().width };
        }, { mode: mode.value, target: mode.target });
        results.push({ width, ...measure });
        assert.ok(measure.rootWidth <= width + 2, 'Horizontal document scroll: ' + JSON.stringify(measure));
        assert.deepEqual(measure.overflows, [], 'Clipped controls in ' + mode.label + '/' + width + ': ' + JSON.stringify(measure.overflows));
        assert.deepEqual(errors, [], 'JavaScript errors: ' + errors.join('; '));
        await page.screenshot({ path: path.join(output, mode.value + '-' + width + '.png') });
        console.log('PASS WebKit ' + mode.label + ' ' + width + 'px');
      } catch(e) {
        await page.screenshot({ path: path.join(output, 'failed-' + mode.value + '-' + width + '.png') }).catch(()=>{});
        throw e;
      } finally {
        await ctx.close();
      }
    }
  }
} finally {
  await browser.close();
  writeFileSync(path.join(output, 'modes-results.json'), JSON.stringify(results, null, 2));
}
