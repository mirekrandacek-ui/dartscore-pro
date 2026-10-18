import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const pkg = 'com.randis2288.dartscorepro';
const out = 'build/android-score-evidence';
mkdirSync(out, { recursive: true });
const serial = process.env.ANDROID_SERIAL;
const adb = (...args) => execFileSync('adb', [...(serial ? ['-s', serial] : []), ...args], { encoding: 'utf8', timeout: args[0] === 'install' ? 120000 : 20000, maxBuffer: 8 * 1024 * 1024 });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser;
try {
  adb('install', '-r', process.env.DARTSCORE_APK || 'app/build/outputs/apk/debug/app-debug.apk');
  adb('shell', 'am', 'force-stop', pkg);
  adb('shell', 'am', 'start', '-n', `${pkg}/.ConsentLauncherActivity`);
  let socket;
  for (let attempt = 0; attempt < 45; attempt++) {
    const sockets = adb('shell', 'cat', '/proc/net/unix');
    let pid = '';
    try { pid = adb('shell', 'pidof', pkg).trim(); } catch {}
    socket = sockets.match(new RegExp(`@(webview_devtools_remote_${pid})(?:\\s|$)`))?.[1];
    const mainVisible = adb('shell', 'dumpsys', 'activity', 'activities').includes(pkg + '/.MainWebViewActivity');
    if (socket && mainVisible) break;
    socket = undefined;
    if (attempt % 10 === 0) console.log('Waiting for native scoring WebView', attempt);
    await delay(2000);
  }
  assert.ok(socket, 'Native scoring WebView debugging socket must appear');
  adb('forward', 'tcp:9224', `localabstract:${socket}`);
  browser = await chromium.connectOverCDP('http://127.0.0.1:9224', { timeout: 20000, noDefaults: true });
  const context = browser.contexts()[0];
  let page;
  for (let attempt = 0; attempt < 30; attempt++) {
    page = context.pages().find(p => p.url().includes('dartscore-pro'));
    if (page) break;
    await delay(1000);
  }
  assert.ok(page, 'Scoring page must exist');
  await page.locator('.lobbyWrap').waitFor({ timeout: 30000 });
  await page.addInitScript(() => {
    localStorage.setItem('lobby', JSON.stringify({ lang: 'cs', ai: 'easy' }));
    localStorage.setItem('savedGame', JSON.stringify({
    screen: 'game', mode: 'classic', lang: 'cs',
    players: [{ id: 1, name: 'Dlouhé jméno hráče' }, { id: 2, name: 'Robot', bot: true, level: 1 }],
    order: [0, 1], currIdx: 0, scores: [100, 44], lastTurn: [180, 100], thrown: [21, 21]
    }));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /^(Pokračovat ve hře|Continue game)$/ }).click({ noWaitAfter: true });
  await page.locator('.classicTurn').first().waitFor();
  assert.deepEqual(await page.locator('.classicAroundPane .playerScore').allTextContents(), ['100', '44']);
  assert.deepEqual(await page.locator('.classicAroundPane .lastTotal').allTextContents(), ['Poslední hod: 180', 'Poslední hod: 100']);
  const result = await page.evaluate(() => {
    const issues = [];
    for (const card of document.querySelectorAll('.classicAroundPane .playerCard')) {
      const cr = card.getBoundingClientRect();
      const cells = [...card.querySelectorAll('.classicTurn > *')];
      for (const el of card.querySelectorAll('.playerScore,.classicTurn,.lastTotal,.dartBox')) {
        const r = el.getBoundingClientRect();
        if (r.left < cr.left || r.right > cr.right - 1 || el.scrollWidth > el.clientWidth + 1)
          issues.push({ text: el.textContent, className: el.className });
      }
      for (let i = 1; i < cells.length; i++)
        if (cells[i - 1].getBoundingClientRect().right > cells[i].getBoundingClientRect().left + 1)
          issues.push({ overlap: i });
    }
    return { width: innerWidth, userAgent: navigator.userAgent, issues, documentWidth: document.documentElement.scrollWidth };
  });
  writeFileSync(`${out}/results.json`, JSON.stringify(result, null, 2));
  await page.screenshot({ path: `${out}/x01-native-webview.png` });
  writeFileSync(`${out}/android-screen.png`, execFileSync('adb', [...(serial ? ['-s', serial] : []), 'exec-out', 'screencap', '-p'], { timeout: 20000 }));
  assert.deepEqual(result.issues, []);
  assert.ok(result.documentWidth <= result.width);
  console.log('PASS actual Android WebView: 100/44, last visit, no clipping or overlapping cells', result.width);
} finally {
  try { writeFileSync(`${out}/logcat.txt`, adb('logcat', '-d', '-t', '2000')); } catch {}
  try { adb('forward', '--remove', 'tcp:9224'); } catch {}
  if (browser) await browser.close();
}
