// Desktop WebKit does not reproduce the native iOS keyboard or its autozoom.
// This checks the computed prevention rule and real touch/focus/edit/blur flows;
// height changes below are explicitly simulated, not native keyboard evidence.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const { webkit, chromium } = await import(process.env.DARTSCORE_PLAYWRIGHT_MODULE || 'playwright');
const output = process.env.DARTSCORE_FOCUS_OUTPUT || 'build/input-focus-evidence';
mkdirSync(output, { recursive: true });
const results = [];
const modes = [
  ['X01', 'classic'], ['Cricket', 'cricket'], ['Around the Clock', 'around'],
  ['Roulette', 'roulette'], ['Roulette Double', 'rouletteDouble'],
];
const base = process.env.DARTSCORE_UI_URL || 'http://127.0.0.1:4173/';

async function measure(page, stage, width, focused) {
  const data = await page.evaluate(() => {
    const doc = document.documentElement;
    const container = document.querySelector('.container').getBoundingClientRect();
    const vv = window.visualViewport;
    return {
      innerWidth, innerHeight, clientWidth: doc.clientWidth, scrollWidth: doc.scrollWidth,
      scrollX, scrollY, vh: doc.style.getPropertyValue('--vh'),
      container: { left: container.left, right: container.right, height: container.height },
      visualViewport: vv && { width: vv.width, height: vv.height, scale: vv.scale,
        offsetLeft: vv.offsetLeft, offsetTop: vv.offsetTop },
      focused: document.activeElement.matches('.playerName input'),
      fonts: [...document.querySelectorAll('.playerName input')].map(el => parseFloat(getComputedStyle(el).fontSize)),
    };
  });
  results.push({ stage, width, ...data });
  assert.equal(data.clientWidth, width, stage);
  assert.ok(data.scrollWidth <= width + 1, JSON.stringify(data));
  assert.ok(Math.abs(data.container.left) <= 1 && data.container.right <= width + 1, JSON.stringify(data));
  assert.equal(data.scrollX, 0, stage);
  assert.equal(data.visualViewport.scale, 1, stage);
  assert.ok(Math.abs(data.visualViewport.width - width) <= 1, stage);
  assert.equal(data.focused, focused, stage);
  assert.ok(data.fonts.every(size => size >= 16), 'Editable input font must prevent iOS autozoom: ' + JSON.stringify(data.fonts));
  return data;
}

try {
  for (const [engine, type] of Object.entries({ webkit, chromium })) {
    const browser = await type.launch();
    try {
      for (const width of [320, 375, 390, 430]) {
        for (const [label, mode] of modes) {
          const context = await browser.newContext({ viewport: { width, height: 844 },
            locale: 'en-US', isMobile: true, hasTouch: true,
            userAgent: engine === 'webkit'
              ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1'
              : 'Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36',
          });
          const page = await context.newPage();
          page.setDefaultTimeout(15000);
          // Optional original stylesheet to prove this check detects build 7.
          if (process.env.DARTSCORE_FOCUS_CSS) {
            const css = readFileSync(process.env.DARTSCORE_FOCUS_CSS, 'utf8');
            await page.route('**/assets/*.css', route => route.fulfill({ contentType: 'text/css', body: css }));
          }
          const errors = [];
          page.on('pageerror', error => errors.push(String(error)));
          try {
            await page.goto(base, { waitUntil: 'domcontentloaded' });
            await page.locator('.playerName input').first().waitFor();
            if (mode !== 'classic') {
              await page.locator('.lobbyModeGroup .themedSelectTrigger').click();
              await page.getByRole('option', { name: label, exact: true }).click();
            }
            const stage = `${engine}/${width}/${mode}`;
            const initial = await measure(page, stage + '/before', width, false);
            const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
            assert.ok(!/user-scalable\s*=\s*no|maximum-scale\s*=/i.test(viewport));
            const input = page.locator('.playerName input').first();
            for (let cycle = 0; cycle < 3; cycle++) {
              await input.tap();
              await measure(page, stage + `/focus-${cycle}`, width, true);
              await input.fill(`Mirek Žluťoučký ${cycle}`);
              await measure(page, stage + `/typed-${cycle}`, width, true);
              // A reduced window is a layout stress check, not a software keyboard.
              if (cycle === 2) {
                await page.setViewportSize({ width, height: 500 });
                await page.waitForFunction(() => Math.abs(parseFloat(document.documentElement.style.getPropertyValue('--vh')) * 100 - innerHeight) < 1);
                await measure(page, stage + '/simulated-short-window', width, true);
              }
              await page.locator('.logo').tap();
              await measure(page, stage + `/blur-${cycle}`, width, false);
              if (cycle === 2) {
                await page.setViewportSize({ width, height: 844 });
                await page.waitForFunction(() => Math.abs(parseFloat(document.documentElement.style.getPropertyValue('--vh')) * 100 - innerHeight) < 1);
              }
              const after = await measure(page, stage + `/restored-${cycle}`, width, false);
              assert.ok(Math.abs(after.container.height - initial.container.height) <= 1,
                'Container height must recover within CSS subpixel rounding');
              assert.equal(await input.inputValue(), `Mirek Žluťoučký ${cycle}`);
            }
            await page.screenshot({ path: `${output}/${engine}-${width}-${mode}-lobby.png` });
            await page.locator('.lobbyWrap .btn.green').first().click();
            await page.locator(`.container[data-screen="game"][data-mode="${mode}"]`).waitFor();
            await measure(page, stage + '/game', width, false);
            assert.ok((await page.locator('.container[data-screen="game"]').textContent()).includes('Mirek Žluťoučký 2'));
            assert.deepEqual(errors, []);
            await page.screenshot({ path: `${output}/${engine}-${width}-${mode}-game.png` });
            console.log(`PASS ${stage}: 3 edit/blur cycles, simulated height recovery, game start`);
          } finally { await context.close(); }
        }
      }
    } finally { await browser.close(); }
  }
} finally {
  writeFileSync(`${output}/metrics.json`, JSON.stringify(results, null, 2));
}
