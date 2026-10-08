
import { chromium } from 'playwright';
import fs from 'node:fs';

const PROD = 'https://dartscore-pro.vercel.app/';
const results = [];
const browser = await chromium.launch({ headless: true });
const pageErrors = [];
const consoleErrors = [];

function add(status, name, details, error) {
  results.push({ status, name, details: details || {}, error: error ? String(error.stack || error.message || error) : undefined });
}
async function scenario(name, fn) {
  const started = Date.now();
  try {
    const details = await fn();
    add('PASS', name, Object.assign({ durationMs: Date.now() - started }, details || {}));
  } catch (e) {
    add('FAIL', name, { durationMs: Date.now() - started }, e);
  }
}
function warn(name, details) { add('WARN', name, details || {}); }

async function makePage(opts = {}) {
  const premium = opts.premium !== false;
  const fast = opts.fast !== false;
  const nativeBridge = opts.nativeBridge !== false;
  const viewport = opts.viewport || { width: 412, height: 915 };

  const context = await browser.newContext({
    viewport,
    locale: 'en-US',
    userAgent: 'Mozilla/5.0 (Linux; Android 15; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36'
  });

  await context.addInitScript(({ premium, fast, nativeBridge }) => {
    try {
      localStorage.clear();
      if (premium) localStorage.setItem('premium', 'true');
    } catch {}

    window.__auditCalls = { speak: [], share: [], media: [], interstitial: 0 };

    if (fast) {
      const ot = window.setTimeout.bind(window);
      const oi = window.setInterval.bind(window);
      const scale = ms => {
        const n = Number(ms) || 0;
        return n <= 100 ? n : Math.max(12, Math.round(n * 0.04));
      };
      window.setTimeout = (fn, ms, ...args) => ot(fn, scale(ms), ...args);
      window.setInterval = (fn, ms, ...args) => oi(fn, scale(ms), ...args);
    }

    try {
      HTMLMediaElement.prototype.play = function() {
        window.__auditCalls.media.push(this.currentSrc || this.src || '');
        return Promise.resolve();
      };
    } catch {}

    if (nativeBridge) {
      window.DartScoreAndroid = {
        setPremium() {},
        buyPremium() {},
        restorePremium() {},
        isPrivacyOptionsRequired() { return false; },
        showPrivacyOptions() {},
        showInterstitial() { window.__auditCalls.interstitial += 1; },
        shareApp(title, text, url) { window.__auditCalls.share.push({ title, text, url }); },
        speak(text, lang) { window.__auditCalls.speak.push({ text: String(text), lang: String(lang) }); }
      };
    }
  }, { premium, fast, nativeBridge });

  const page = await context.newPage();
  page.on('pageerror', e => pageErrors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await page.goto(PROD, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('.lobbyWrap').waitFor({ state: 'visible', timeout: 30000 });
  return { context, page };
}

async function closeEnv(env) { await env.context.close(); }
async function choose(page, trigger, option) {
  await trigger.click();
  const opt = page.getByRole('option', { name: option, exact: true });
  await opt.waitFor({ state: 'visible', timeout: 5000 });
  await opt.click();
}
async function setLanguage(page, option) {
  await choose(page, page.locator('.header .controls .themedSelectTrigger'), option);
}
async function setMode(page, option) {
  await choose(page, page.locator('.lobbyModeGroup .themedSelectTrigger'), option);
}
async function chooseByLabel(page, label, option) {
  const s = page.getByText(label, { exact: true }).first();
  const trigger = s.locator('xpath=following-sibling::span[contains(@class,"themedSelectWrap")]//button[contains(@class,"themedSelectTrigger")]');
  await choose(page, trigger, option);
}
async function key(page, n) {
  const b = page.locator('button.key').filter({ hasText: new RegExp('^' + String(n) + '$') }).first();
  await b.waitFor({ state: 'visible', timeout: 5000 });
  await b.click();
}
async function triple(page, n) {
  await page.getByRole('button', { name: 'TRIPLE', exact: true }).click();
  await key(page, n);
}
async function doubleHit(page, n) {
  await page.getByRole('button', { name: 'DOUBLE', exact: true }).click();
  await key(page, n);
}
async function waitActive(page, mode, expected) {
  const selector = mode === 'cricket' ? '.playerCol.active .playerColName' : '.playerCard.active .playerNameText';
  await page.waitForFunction(arg => {
    const el = document.querySelector(arg.selector);
    return el && (el.textContent || '').includes(arg.expected);
  }, { selector, expected }, { timeout: 5000 });
}
async function waitWinner(page, expected) {
  await page.waitForFunction(expected => {
    const el = document.querySelector('.winner');
    return el && (el.textContent || '').includes(expected);
  }, expected, { timeout: 5000 });
}
async function start(page) {
  await page.getByRole('button', { name: '▶ Start Game', exact: true }).click();
  await page.locator('.gameWrap').waitFor({ state: 'visible', timeout: 5000 });
}
async function restart(page) {
  await page.getByRole('button', { name: 'Restart game', exact: true }).click();
  await page.locator('.gameWrap').waitFor({ state: 'visible', timeout: 5000 });
}
async function score(page, i = 0) { return (await page.locator('.playerScore').nth(i).innerText()).trim(); }

await scenario('Classic - 10 complete games', async () => {
  const env = await makePage();
  try {
    const p = env.page;
    await p.getByRole('button', { name: '101', exact: true }).click();
    await start(p);
    for (let g = 0; g < 10; g++) {
      if (g) await restart(p);
      await triple(p, 17);
      await key(p, 50);
      await waitWinner(p, 'Player 1');
    }
    const stored = await p.evaluate(() => JSON.parse(localStorage.getItem('finishedGames') || '[]').length);
    return { games: 10, storedFinishedGames: stored };
  } finally { await closeEnv(env); }
});

await scenario('Cricket - 10 complete games', async () => {
  const env = await makePage();
  try {
    const p = env.page;
    await setMode(p, 'Cricket');
    await start(p);
    for (let g = 0; g < 10; g++) {
      if (g) await restart(p);
      await triple(p, 15); await triple(p, 16); await triple(p, 17);
      await waitActive(p, 'cricket', 'Player 2');
      await key(p, 0); await key(p, 0); await key(p, 0);
      await waitActive(p, 'cricket', 'Player 1');
      await triple(p, 18); await triple(p, 19); await triple(p, 20);
      await waitActive(p, 'cricket', 'Player 2');
      await key(p, 0); await key(p, 0); await key(p, 0);
      await waitActive(p, 'cricket', 'Player 1');
      await doubleHit(p, 25); await key(p, 25);
      await waitWinner(p, 'Player 1');
    }
    return { games: 10 };
  } finally { await closeEnv(env); }
});

await scenario('Around the Clock - 10 complete games', async () => {
  const env = await makePage();
  try {
    const p = env.page;
    await setMode(p, 'Around the Clock');
    await start(p);
    const targets = Array.from({ length: 20 }, (_, i) => i + 1).concat([25]);
    for (let g = 0; g < 10; g++) {
      if (g) await restart(p);
      for (let i = 0; i < targets.length; i += 3) {
        for (const t of targets.slice(i, i + 3)) await key(p, t);
        if (i + 3 >= targets.length) break;
        await waitActive(p, 'around', 'Player 2');
        await key(p, 0); await key(p, 0); await key(p, 0);
        await waitActive(p, 'around', 'Player 1');
      }
      await waitWinner(p, 'Player 1');
    }
    return { games: 10 };
  } finally { await closeEnv(env); }
});

async function rouletteGame(p, mode) {
  for (let round = 0; round < 8; round++) {
    await waitActive(p, mode, 'Player 1');
    await p.waitForFunction(() => {
      const b = document.querySelector('button.rouletteDrawBtn');
      return b && !b.disabled;
    });
    await p.locator('button.rouletteDrawBtn').click();
    for (let d = 0; d < 3; d++) {
      await p.waitForFunction(() => {
        const b = document.querySelector('button.rouletteHitBtn');
        return b && !b.disabled;
      }, null, { timeout: 5000 });
      await p.locator('button.rouletteHitBtn').click();
      if (d < 2) await p.waitForTimeout(45);
    }
    await waitActive(p, mode, 'Player 2');
    await p.locator('button.rouletteSwitchBtn').click();
    if (round < 7) await waitActive(p, mode, 'Player 1');
  }
  await waitWinner(p, 'Player 1');
}

await scenario('Roulette - 10 complete 8-round games', async () => {
  const env = await makePage();
  try {
    const p = env.page;
    await setMode(p, 'Roulette');
    await start(p);
    for (let g = 0; g < 10; g++) {
      if (g) await restart(p);
      await rouletteGame(p, 'roulette');
    }
    return { games: 10, roundsPerGame: 8 };
  } finally { await closeEnv(env); }
});

await scenario('Roulette Double - 10 complete 8-round games', async () => {
  const env = await makePage();
  try {
    const p = env.page;
    await setMode(p, 'Roulette Double');
    await start(p);
    for (let g = 0; g < 10; g++) {
      if (g) await restart(p);
      await rouletteGame(p, 'rouletteDouble');
    }
    return { games: 10, roundsPerGame: 8 };
  } finally { await closeEnv(env); }
});

await scenario('Classic bust leaving 1 restores visit', async () => {
  const env = await makePage();
  try {
    const p = env.page;
    await p.getByRole('button', { name: '101', exact: true }).click();
    await start(p);
    await triple(p, 20); await key(p, 20); await key(p, 20);
    await waitActive(p, 'classic', 'Player 2');
    const v = await score(p, 0);
    if (v !== '101') throw new Error('Expected 101 after bust, got ' + v);
    return { scoreAfterBust: v };
  } finally { await closeEnv(env); }
});

await scenario('Classic Undo restores score', async () => {
  const env = await makePage();
  try {
    const p = env.page;
    await p.getByRole('button', { name: '101', exact: true }).click();
    await start(p);
    await key(p, 20);
    if (await score(p, 0) !== '81') throw new Error('20 did not produce 81');
    await p.getByRole('button', { name: 'Undo', exact: true }).click();
    if (await score(p, 0) !== '101') throw new Error('Undo did not restore 101');
    return { afterHit: 81, afterUndo: 101 };
  } finally { await closeEnv(env); }
});

await scenario('Round-total input and turn switch', async () => {
  const env = await makePage();
  try {
    const p = env.page;
    await p.getByRole('button', { name: '101', exact: true }).click();
    await chooseByLabel(p, 'Scoring type', 'Round total');
    await start(p);
    await p.getByRole('button', { name: '6', exact: true }).click();
    await p.getByRole('button', { name: '0', exact: true }).click();
    await p.getByRole('button', { name: 'OK', exact: true }).click();
    if (await score(p, 0) !== '41') throw new Error('Expected 41 after round 60');
    await waitActive(p, 'classic', 'Player 2');
    return { scoreAfterRound: 41 };
  } finally { await closeEnv(env); }
});

await scenario('Classic teams checkout', async () => {
  const env = await makePage();
  try {
    const p = env.page;
    await p.getByRole('button', { name: '101', exact: true }).click();
    await chooseByLabel(p, 'Player mode', 'Teams');
    await start(p);
    await triple(p, 17); await key(p, 50);
    await waitWinner(p, 'Team A');
    return { winner: 'Team A' };
  } finally { await closeEnv(env); }
});

await scenario('Invalid one-team setup blocked', async () => {
  const env = await makePage();
  try {
    const p = env.page;
    await chooseByLabel(p, 'Player mode', 'Teams');
    const selects = p.locator('.playerRow .themedSelectTrigger');
    await choose(p, selects.nth(1), 'Team A');
    let msg = '';
    p.once('dialog', async d => { msg = d.message(); await d.accept(); });
    await p.getByRole('button', { name: '▶ Start Game', exact: true }).click();
    await p.waitForTimeout(60);
    if (!msg.includes('At least two teams')) throw new Error('No invalid-team alert: ' + msg);
    return { dialog: msg };
  } finally { await closeEnv(env); }
});

await scenario('Premium save/back/continue restores score', async () => {
  const env = await makePage({ premium: true });
  try {
    const p = env.page;
    await p.getByRole('button', { name: '101', exact: true }).click();
    await start(p);
    await key(p, 20);
    await p.getByRole('button', { name: 'Save game', exact: true }).click();
    await p.getByRole('button', { name: 'Back', exact: true }).click();
    await p.locator('.lobbyWrap').waitFor({ state: 'visible' });
    await p.getByRole('button', { name: 'Continue game', exact: true }).click();
    await p.locator('.gameWrap').waitFor({ state: 'visible' });
    const restored = await score(p, 0);
    if (restored !== '81') throw new Error('Expected 81 restored, got ' + restored);
    return { restoredScore: restored };
  } finally { await closeEnv(env); }
});

await scenario('Player add/delete/reorder', async () => {
  const env = await makePage();
  try {
    const p = env.page;
    await p.getByRole('button', { name: /Add player/i }).click();
    const inputs = p.locator('.playerRow input');
    if (await inputs.count() !== 3) throw new Error('Expected 3 players');
    await inputs.nth(2).fill('Audit Player');
    await p.locator('.playerRow').nth(2).getByRole('button', { name: 'Up', exact: true }).click();
    const names = await p.locator('.playerRow input').evaluateAll(es => es.map(e => e.value));
    if (names[1] !== 'Audit Player') throw new Error('Reorder failed');
    await p.locator('.playerRow').nth(1).locator('button.trash').click();
    if (await p.locator('.playerRow').count() !== 2) throw new Error('Delete failed');
    return { namesAfterMove: names, finalCount: 2 };
  } finally { await closeEnv(env); }
});

await scenario('Free player limit', async () => {
  const env = await makePage({ premium: false });
  try {
    const p = env.page;
    for (let i = 0; i < 5; i++) await p.getByRole('button', { name: /Add player/i }).click();
    const count = await p.locator('.playerRow').count();
    if (count > 3) warn('Free player-count limit not enforced', { expectedMax: 3, actual: count });
    return { playersCreated: count };
  } finally { await closeEnv(env); }
});

await scenario('Premium player limit', async () => {
  const env = await makePage({ premium: true });
  try {
    const p = env.page;
    for (let i = 0; i < 6; i++) await p.getByRole('button', { name: /Add player/i }).click();
    const count = await p.locator('.playerRow').count();
    if (count > 5) warn('Premium player-count limit not enforced', { expectedMax: 5, actual: count });
    return { playersCreated: count };
  } finally { await closeEnv(env); }
});

await scenario('Rate button WebView failure reproduction', async () => {
  const env = await makePage({ premium: false });
  try {
    const p = env.page;
    await p.evaluate(() => {
      window.__rateCalls = [];
      window.open = (...args) => { window.__rateCalls.push(args); return null; };
    });
    const before = p.url();
    await p.getByRole('button', { name: /Do you like the app/ }).click();
    await p.waitForTimeout(100);
    const after = p.url();
    const calls = await p.evaluate(() => window.__rateCalls);
    if (!calls.length) throw new Error('window.open was not called');
    if (after === before) throw new Error('CONFIRMED: window.open returned null and no fallback navigation happened');
    return { before, after, calls };
  } finally { await closeEnv(env); }
});

await scenario('Native share bridge is used', async () => {
  const env = await makePage({ premium: false });
  try {
    const p = env.page;
    await p.locator('button.shareIconBtn').click();
    const calls = await p.evaluate(() => window.__auditCalls.share);
    if (calls.length !== 1) throw new Error('Expected one native share call, got ' + calls.length);
    return calls[0];
  } finally { await closeEnv(env); }
});

await scenario('Audio assets and fanfare', async () => {
  const env = await makePage();
  try {
    const p = env.page;
    const h = await p.request.get(PROD + 'dart-hit.mp3');
    const f = await p.request.get(PROD + 'tada-fanfare-a-6313.mp3');
    if (!h.ok() || !f.ok()) throw new Error('Audio asset HTTP failure');
    await p.getByRole('button', { name: '101', exact: true }).click();
    await start(p);
    await triple(p, 17); await key(p, 50); await waitWinner(p, 'Player 1');
    const calls = await p.evaluate(() => window.__auditCalls.media);
    if (!calls.some(x => x.includes('dart-hit.mp3'))) throw new Error('Hit sound not played');
    if (!calls.some(x => x.includes('tada-fanfare-a-6313.mp3'))) throw new Error('Fanfare not played');
    return { hitStatus: h.status(), fanfareStatus: f.status(), mediaCalls: calls.length };
  } finally { await closeEnv(env); }
});

await scenario('Sound OFF suppresses audio', async () => {
  const env = await makePage();
  try {
    const p = env.page;
    await p.getByRole('button', { name: 'Sound', exact: true }).click();
    await p.getByRole('button', { name: '101', exact: true }).click();
    await start(p);
    await triple(p, 17); await key(p, 50); await waitWinner(p, 'Player 1');
    const calls = await p.evaluate(() => window.__auditCalls.media);
    if (calls.length) throw new Error('Sound off still played media: ' + JSON.stringify(calls));
    return { mediaCalls: 0 };
  } finally { await closeEnv(env); }
});

await scenario('7 language review labels', async () => {
  const env = await makePage({ premium: false });
  try {
    const p = env.page;
    const values = [
      ['Čeština', 'Líbí se ti aplikace?'],
      ['English', 'Do you like the app?'],
      ['Deutsch', 'Gefällt dir die App?'],
      ['Español', '¿Te gusta la app?'],
      ['Nederlands', 'Vind je de app leuk?'],
      ['Русский', 'Нравится приложение?'],
      ['中文', '喜欢这个应用吗？']
    ];
    const out = [];
    for (const item of values) {
      await setLanguage(p, item[0]);
      const body = await p.locator('.header .controls').innerText();
      if (!body.includes(item[1])) throw new Error('Missing label for ' + item[0] + ': ' + item[1]);
      out.push(item[0]);
    }
    return { languages: out };
  } finally { await closeEnv(env); }
});

await scenario('Chinese share label is localized', async () => {
  const env = await makePage({ premium: false });
  try {
    const p = env.page;
    await setLanguage(p, '中文');
    const title = await p.locator('button.shareIconBtn').getAttribute('title');
    if (title === 'Share app') throw new Error('Chinese share UI falls back to English');
    return { title };
  } finally { await closeEnv(env); }
});

await scenario('English Premium UI has no Czech-only heading', async () => {
  const env = await makePage({ premium: true });
  try {
    const body = await env.page.locator('body').innerText();
    if (body.includes('Vzhled aplikace:')) throw new Error('Hard-coded Czech theme heading visible in English');
    return {};
  } finally { await closeEnv(env); }
});

await scenario('Responsive 360px lobby has no horizontal control overflow', async () => {
  const env = await makePage({ viewport: { width: 360, height: 800 } });
  try {
    const overflow = await env.page.evaluate(() => [...document.querySelectorAll('button,input,.themedSelectTrigger')]
      .filter(el => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0 &&
          (r.left < -1 || r.right > innerWidth + 1);
      })
      .map(el => ({ text: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim(), left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right })));
    if (overflow.length) throw new Error('Horizontal overflow: ' + JSON.stringify(overflow));
    return { overflowCount: 0 };
  } finally { await closeEnv(env); }
});

await scenario('Random order changes across 10 starts', async () => {
  const env = await makePage();
  try {
    const p = env.page;
    await chooseByLabel(p, 'Order', 'Random');
    const orders = new Set();
    for (let i = 0; i < 10; i++) {
      if (!i) await start(p); else await restart(p);
      const names = await p.locator('.playerCard .playerNameText').evaluateAll(es => es.map(e => e.textContent.trim()).join('|'));
      orders.add(names);
    }
    if (orders.size < 2) throw new Error('Random order never changed');
    return { distinctOrders: orders.size, values: [...orders] };
  } finally { await closeEnv(env); }
});

await scenario('Classic bot automatic turn smoke', async () => {
  const env = await makePage();
  try {
    const p = env.page;
    await chooseByLabel(p, 'Bot', 'Beginner');
    await p.getByRole('button', { name: '101', exact: true }).click();
    await start(p);
    await key(p, 0); await key(p, 0); await key(p, 0);
    await waitActive(p, 'classic', 'Player 2');
    await key(p, 0); await key(p, 0); await key(p, 0);
    await p.waitForTimeout(350);
    const bot = p.locator('.playerCard').filter({ hasText: /Bot/ }).first();
    if (!(await bot.count())) throw new Error('Bot card missing');
    return { botCard: (await bot.innerText()).slice(0, 300) };
  } finally { await closeEnv(env); }
});

await scenario('Roulette tie handling', async () => {
  const env = await makePage();
  try {
    const p = env.page;
    await setMode(p, 'Roulette');
    await start(p);
    for (let r = 0; r < 8; r++) {
      await p.locator('button.rouletteSwitchBtn').click();
      await waitActive(p, 'roulette', 'Player 2');
      await p.locator('button.rouletteSwitchBtn').click();
      if (r < 7) await waitActive(p, 'roulette', 'Player 1');
    }
    await p.locator('.winner').waitFor({ state: 'visible' });
    const txt = await p.locator('.winner').innerText();
    if (txt.includes('Player 1')) warn('Roulette 0-0 tie selects Player 1 as winner', { winnerText: txt.slice(0, 200) });
    return { winnerText: txt.slice(0, 200) };
  } finally { await closeEnv(env); }
});

const src = fs.readFileSync('src/App.jsx', 'utf8');
if (src.includes("speak(lang, 'Vítěz!', voiceOn)")) warn('Winner TTS text hard-coded Czech', { evidence: "speak(lang, 'Vítěz!', voiceOn)" });
if (src.includes("showToast('Nic k pokračování')")) warn('Saved-game invalid toast hard-coded Czech', { evidence: "showToast('Nic k pokračování')" });
if (src.includes('Vzhled aplikace:')) warn('Premium theme heading hard-coded Czech', { evidence: 'Vzhled aplikace:' });
if (src.includes("window.open(url, '_blank', 'noopener,noreferrer')")) warn('Rate button depends on window.open(_blank)', { impact: 'Android WebView popup path can return null without throwing.' });
if (src.includes("const APP_VERSION = '1.1.19'")) warn('Production web APP_VERSION is stale', { web: '1.1.19', android: '1.1.61' });
if (src.includes('playedGamesSinceAdRef') && src.includes('completedVisits >= 3')) warn('Production web uses legacy interstitial cadence', { impact: 'Does not match newer every-third-Lobby-Start design.' });

const uniquePageErrors = [...new Set(pageErrors)];
const uniqueConsoleErrors = [...new Set(consoleErrors)];
const summary = {
  generatedAt: new Date().toISOString(),
  target: PROD,
  total: results.length,
  pass: results.filter(x => x.status === 'PASS').length,
  fail: results.filter(x => x.status === 'FAIL').length,
  warn: results.filter(x => x.status === 'WARN').length,
  pageErrors: uniquePageErrors,
  consoleErrors: uniqueConsoleErrors,
  results
};
fs.mkdirSync('audit-output', { recursive: true });
fs.writeFileSync('audit-output/audit-report.json', JSON.stringify(summary, null, 2));

const md = [];
md.push('# DartScore Pro full-flow audit');
md.push('');
md.push('Target: ' + PROD);
md.push('');
md.push('PASS ' + summary.pass + ' / FAIL ' + summary.fail + ' / WARN ' + summary.warn);
md.push('');
for (const r of results) {
  md.push('## [' + r.status + '] ' + r.name);
  if (r.error) md.push('', r.error.replace(/\n/g, ' ').slice(0, 1800));
  if (r.details && Object.keys(r.details).length) md.push('', '    ' + JSON.stringify(r.details).slice(0, 4000));
  md.push('');
}
if (uniquePageErrors.length) md.push('## Page errors', '', '    ' + JSON.stringify(uniquePageErrors));
if (uniqueConsoleErrors.length) md.push('## Console errors', '', '    ' + JSON.stringify(uniqueConsoleErrors));
fs.writeFileSync('audit-output/audit-report.md', md.join('\n'));

console.log(JSON.stringify({
  total: summary.total,
  pass: summary.pass,
  fail: summary.fail,
  warn: summary.warn,
  failed: results.filter(x => x.status === 'FAIL').map(x => x.name),
  warnings: results.filter(x => x.status === 'WARN').map(x => x.name),
  pageErrors: uniquePageErrors,
  consoleErrors: uniqueConsoleErrors
}, null, 2));

await browser.close();
