import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE_URL = process.argv[2] || 'https://dartscore-pro.vercel.app/';
const results = [];
const details = {};

function record(name, status, detail='') {
  results.push({ name, status, detail });
  console.log(`[${status}] ${name}${detail ? ' :: ' + detail : ''}`);
}
async function check(name, fn) {
  try {
    const detail = await fn();
    record(name, 'PASS', typeof detail === 'string' ? detail : '');
  } catch (e) {
    record(name, 'FAIL', e?.message || String(e));
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const appSource = fs.readFileSync('src/App.jsx', 'utf8');
const javaSource = fs.readFileSync('app/src/main/java/com/randis2288/dartscorepro/MainWebViewActivity.java', 'utf8');
const gradleSource = fs.readFileSync('app/build.gradle', 'utf8');

function extractLangBody(lang) {
  const marker = `  ${lang}: {`;
  const idx = appSource.indexOf(marker);
  if (idx < 0) return '';
  const start = appSource.indexOf('{', idx);
  let depth = 0, quote = null, esc = false, lineComment = false, blockComment = false;
  for (let i = start; i < appSource.length; i++) {
    const c = appSource[i], n = appSource[i + 1];
    if (lineComment) { if (c === '\n') lineComment = false; continue; }
    if (blockComment) { if (c === '*' && n === '/') { blockComment = false; i++; } continue; }
    if (quote) {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '/' && n === '/') { lineComment = true; i++; continue; }
    if (c === '/' && n === '*') { blockComment = true; i++; continue; }
    if (c === '{') depth++;
    if (c === '}') {
      depth--;
      if (depth === 0) return appSource.slice(start + 1, i);
    }
  }
  return '';
}

await check('STATIC: translation key parity', async () => {
  const langs = ['cs','en','de','es','nl','ru','zh'];
  const sets = {};
  for (const lang of langs) {
    const body = extractLangBody(lang);
    sets[lang] = new Set([...body.matchAll(/^\s*([A-Za-z_$][\w$]*)\s*:/gm)].map(m => m[1]));
  }
  const base = sets.cs;
  const gaps = {};
  for (const lang of langs) gaps[lang] = [...base].filter(k => !sets[lang].has(k));
  details.translationGaps = gaps;
  const any = Object.entries(gaps).filter(([,v]) => v.length);
  assert(any.length === 0, JSON.stringify(gaps));
  return '7 language packs have identical keys';
});

await check('STATIC: review button has native Android bridge + web fallback', async () => {
  const ix = appSource.indexOf('const rateApp =');
  const block = appSource.slice(ix, ix + 900);
  assert(block.includes('window.DartScoreAndroid?.rateApp'), 'rateApp does not prefer native Android bridge');
  assert(/const\s+\w+\s*=\s*window\.open/.test(block) && /if\s*\([^)]*\)\s*window\.location\.assign/.test(block),
    'web rateApp fallback does not handle blocked/null popup');
  assert(javaSource.includes('public void rateApp()'), 'native JS bridge rateApp() missing');
  assert(javaSource.includes('openStoreListingNative'), 'native Play Store opener missing');
});

await check('STATIC: Premium banner cannot reappear after async load', async () => {
  const ix = javaSource.indexOf('public void onAdLoaded()');
  const block = javaSource.slice(ix, ix + 900);
  assert(/currentPremiumState/.test(block), 'onAdLoaded() does not re-check Premium');
  assert(/premiumStateKnown/.test(block), 'onAdLoaded() can show before Premium ownership is known');
  const loadIx = javaSource.indexOf('private void loadBanner()');
  const loadBlock = javaSource.slice(loadIx, loadIx + 500);
  assert(/premiumStateKnown/.test(loadBlock) && /currentPremiumState/.test(loadBlock),
    'loadBanner() can request an ad before Premium ownership is known');
  assert(!javaSource.includes('setPremiumState(false);\n        webView.loadUrl'),
    'startup still forces Free before Billing resolves');
});

await check('STATIC: Premium blocks interstitial', async () => {
  const ix = javaSource.indexOf('private void showInterstitialInternal()');
  const block = javaSource.slice(ix, ix + 500);
  assert(/currentPremiumState/.test(block) && /return;/.test(block), 'Premium guard missing');
  return 'native interstitial guard found';
});

await check('STATIC: mediation adapters packaged', async () => {
  assert(gradleSource.includes("com.google.ads.mediation:unity:4.16.6.0"), 'Unity adapter missing');
  assert(gradleSource.includes("com.google.ads.mediation:facebook:6.21.0.1"), 'Meta adapter missing');
  assert(gradleSource.includes("play-services-ads:24.9.0"), 'Google Mobile Ads SDK missing');
  return 'Google + Unity + Meta present';
});

await check('STATIC: app internal defaults version matches current release', async () => {
  const m = appSource.match(/const APP_VERSION = '([^']+)'/);
  assert(m, 'APP_VERSION not found');
  assert(m[1] === '1.1.62', `APP_VERSION is ${m[1]}, release is 1.1.62`);
  assert(gradleSource.includes('versionCode 96'), 'Android versionCode is not 96');
  assert(gradleSource.includes('versionName "1.1.62"'), 'Android versionName is not 1.1.62');
});

await check('STATIC: Android v96 serves the web bundle frozen inside the AAB', async () => {
  assert(javaSource.includes('new OfflineWebViewClient('), 'MainWebViewActivity does not use bundled OfflineWebViewClient');
  assert(gradleSource.includes('bundleOfflineWebApp'), 'Gradle does not bundle dist into Android assets');
  assert(gradleSource.includes('generated/offlineAssets'), 'Bundled web assets are not wired into Android sourceSets');
});

await check('STATIC: Premium Save Game does not fake a finished match', async () => {
  const ix = appSource.indexOf('saveGame={() =>');
  const block = appSource.slice(ix, ix + 1500);
  assert(!block.includes("localStorage.getItem('finishedGames')"), 'Save Game writes to finishedGames before the match is finished');
  assert(block.includes('saveSnapshot()'), 'Save Game does not persist resumable snapshot');
});

await check('STATIC: known Czech-only runtime messages are localized', async () => {
  for (const bad of [
    "showToast('Nic k pokračování')",
    "showToast('Obnova selhala')",
    "showToast('Nákup byl zrušen.')",
    "showToast('Google Play nákup není v této verzi dostupný')",
    '<h2>Ups, něco se pokazilo.</h2>'
  ]) {
    assert(!appSource.includes(bad), 'hard-coded runtime text remains: '+bad);
  }
});

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  locale: 'cs-CZ',
  viewport: { width: 412, height: 915 },
  userAgent: 'Mozilla/5.0 (Linux; Android 14; QA) AppleWebKit/537.36 Chrome/154 Mobile Safari/537.36'
});
const page = await context.newPage();

await page.addInitScript(() => {
  window.__qa = { speaks: [], shares: [], premiumStates: [], interstitials: 0, mediaPlays: 0, rateApps: 0 };
  const realTimeout = window.setTimeout.bind(window);
  const realInterval = window.setInterval.bind(window);
  window.setTimeout = (fn, ms, ...args) => realTimeout(fn, Math.min(Number(ms) || 0, 25), ...args);
  window.setInterval = (fn, ms, ...args) => realInterval(fn, Math.min(Number(ms) || 0, 25), ...args);
  try {
    HTMLMediaElement.prototype.play = function() {
      window.__qa.mediaPlays += 1;
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function() {};
  } catch {}
  window.DartScoreAndroid = {
    setPremium(v) { window.__qa.premiumStates.push(Boolean(v)); },
    buyPremium() { window.__qa.buyPremium = (window.__qa.buyPremium || 0) + 1; },
    restorePremium() { window.__qa.restorePremium = (window.__qa.restorePremium || 0) + 1; },
    isPrivacyOptionsRequired() { return false; },
    showPrivacyOptions() {},
    shareApp(title, text, url) { window.__qa.shares.push({title,text,url}); },
    rateApp() { window.__qa.rateApps += 1; },
    showInterstitial() { window.__qa.interstitials += 1; },
    speak(text, lang) { window.__qa.speaks.push({text:String(text),lang:String(lang)}); }
  };
});

async function reset(premium=false) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate((premium) => {
    localStorage.clear();
    if (premium) localStorage.setItem('premium','true');
  }, premium);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('.lobbyWrap', { timeout: 30000 });
  await page.waitForTimeout(80);
}

async function choose(trigger, optionText) {
  await trigger.click();
  const opt = page.getByRole('option', { name: optionText, exact: true });
  await opt.waitFor({ state: 'visible', timeout: 5000 });
  await opt.click();
  await page.waitForTimeout(30);
}
async function setMode(label) {
  await choose(page.locator('.lobbyModeGroup .themedSelectTrigger'), label);
}
async function setRoundMode() {
  const card = page.locator('.lobbyCard').filter({ hasText: 'Typ počítání' }).first();
  const trigger = card.locator('.themedSelectTrigger').last();
  await choose(trigger, 'Součet kola');
}
async function setAnyOut101() {
  await page.getByRole('button', { name: '101', exact: true }).click();
  for (const labelText of ['Double-out','Triple-out']) {
    const input = page.locator('label').filter({ hasText: labelText }).locator('input[type="checkbox"]');
    if (await input.isChecked()) await input.click();
  }
}
async function startGame() {
  await page.getByRole('button', { name: /Start hry/ }).click();
  await page.waitForSelector('.gameWrap', { timeout: 5000 });
  await page.waitForTimeout(50);
}
async function restartGame() {
  await page.getByRole('button', { name: 'Opakovat hru', exact: true }).click();
  await page.waitForTimeout(50);
}
async function enterRound(n) {
  const pad = page.locator('.roundTotalKeypad');
  for (const ch of String(n)) await pad.getByRole('button', { name: ch, exact: true }).click();
  await pad.getByRole('button', { name: 'OK', exact: true }).click();
  await page.waitForTimeout(60);
}
async function expectWinner() {
  await page.waitForSelector('.playerCard.winner', { timeout: 5000 });
  return await page.locator('.playerCard.winner').count();
}
async function clickKey(n) {
  await page.locator('.padPane').getByRole('button', { name: String(n), exact: true }).click();
  await page.waitForTimeout(8);
}
async function triple(n) {
  await page.getByRole('button', { name: 'TRIPLE', exact: true }).click();
  await clickKey(n);
}
async function double(n) {
  await page.getByRole('button', { name: 'DOUBLE', exact: true }).click();
  await clickKey(n);
}

await check('E2E: review button uses native Android Play Store bridge', async () => {
  await reset(false);
  await page.evaluate(() => { window.open = () => null; });
  const before = await page.evaluate(() => window.__qa.rateApps);
  await page.getByRole('button', { name: /Líbí se ti aplikace/ }).click();
  await page.waitForTimeout(80);
  const after = await page.evaluate(() => window.__qa.rateApps);
  assert(after === before + 1, `native rateApp calls ${before}->${after}`);
});

await check('E2E: Classic 10 complete games', async () => {
  await reset(false);
  await setAnyOut101();
  await setRoundMode();
  await startGame();
  for (let g=0; g<10; g++) {
    await enterRound(101);
    await expectWinner();
    if (g < 9) await restartGame();
  }
  const count = await page.evaluate(() => JSON.parse(localStorage.getItem('finishedGames') || '[]').length);
  assert(count >= 10, `finishedGames=${count}`);
  return '10/10';
});

await check('E2E: Cricket 10 complete games', async () => {
  await reset(false);
  await setMode('Cricket');
  await startGame();
  for (let g=0; g<10; g++) {
    await triple(15); await triple(16); await triple(17);
    await page.waitForTimeout(60);
    await clickKey(0); await clickKey(0); await clickKey(0);
    await page.waitForTimeout(60);
    await triple(18); await triple(19); await triple(20);
    await page.waitForTimeout(60);
    await clickKey(0); await clickKey(0); await clickKey(0);
    await page.waitForTimeout(60);
    await double(25); await clickKey(25);
    await expectWinner();
    if (g < 9) await restartGame();
  }
  return '10/10';
});

await check('E2E: Around the Clock 10 complete games', async () => {
  await reset(false);
  await setMode('Around the Clock');
  await startGame();
  const targets = [...Array.from({length:20},(_,i)=>i+1),25];
  for (let g=0; g<10; g++) {
    for (let chunk=0; chunk<7; chunk++) {
      for (const n of targets.slice(chunk*3, chunk*3+3)) await clickKey(n);
      if (chunk < 6) {
        await page.waitForTimeout(60);
        await clickKey(0); await clickKey(0); await clickKey(0);
        await page.waitForTimeout(60);
      }
    }
    await expectWinner();
    if (g < 9) await restartGame();
  }
  return '10/10';
});

async function roulette10(modeLabel) {
  await reset(false);
  await setMode(modeLabel);
  await startGame();
  for (let g=0; g<10; g++) {
    const draw = page.getByRole('button', { name: 'Losovat', exact: true });
    await draw.click();
    await page.waitForTimeout(120);
    const hit = page.getByRole('button', { name: 'Zásah +1', exact: true });
    await hit.waitFor({ state:'visible', timeout:5000 });
    await hit.click();
    await page.waitForTimeout(140);
    await page.getByRole('button', { name: 'Přepnout hráče', exact: true }).click();
    await page.waitForTimeout(70);
    for (let i=0; i<15; i++) {
      await page.getByRole('button', { name: 'Přepnout hráče', exact: true }).click();
      await page.waitForTimeout(55);
    }
    await expectWinner();
    if (g < 9) await restartGame();
  }
}

await check('E2E: Roulette 10 complete games', async () => {
  await roulette10('Ruleta');
  return '10/10';
});
await check('E2E: Roulette Double 10 complete games', async () => {
  await roulette10('Ruleta Double');
  return '10/10';
});

await check('E2E: Classic undo restores score', async () => {
  await reset(false);
  await startGame();
  await clickKey(20);
  let score = await page.locator('.playerCard.active .playerScore').textContent();
  assert(score.trim() === '481', `after 20 score=${score}`);
  await page.locator('.multBtn.backspace').click();
  await page.waitForTimeout(40);
  score = await page.locator('.playerCard.active .playerScore').textContent();
  assert(score.trim() === '501', `after undo score=${score}`);
});

await check('E2E: Double-out leaving 1 is bust', async () => {
  await reset(false);
  await page.getByRole('button', { name:'101', exact:true }).click();
  await setRoundMode();
  await startGame();
  await enterRound(100);
  const scores = await page.locator('.playerScore').allTextContents();
  assert(scores.includes('101'), `scores=${JSON.stringify(scores)}`);
});

await check('E2E: Back -> Continue restores current game', async () => {
  await reset(true);
  await startGame();
  await clickKey(20); await clickKey(20); await clickKey(20);
  await page.waitForTimeout(60);
  await page.getByRole('button', { name:'Zpět', exact:true }).first().click();
  await page.waitForSelector('.lobbyWrap');
  await page.getByRole('button', { name:'Pokračovat ve hře', exact:true }).click();
  await page.waitForSelector('.gameWrap');
  const scores = await page.locator('.playerScore').allTextContents();
  assert(scores.some(x => x.trim() === '441'), `restored scores=${JSON.stringify(scores)}`);
});

await check('E2E: Premium Save Game does not add unfinished match to statistics', async () => {
  await reset(true);
  await startGame();
  await clickKey(20);
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('finishedGames') || '[]').length);
  await page.getByRole('button', { name:'Uložit hru', exact:true }).click();
  await page.waitForTimeout(50);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('finishedGames') || '[]').length);
  assert(after === before, `unfinished match was added: before=${before}, after=${after}`);
});

await check('E2E: zero players cannot start a game', async () => {
  await reset(false);
  while (await page.locator('.playerRow').count()) {
    await page.locator('.playerRow').first().locator('button.trash').click();
  }
  await page.getByRole('button', { name:/Start hry/ }).click();
  await page.waitForTimeout(60);
  assert(await page.locator('.lobbyWrap').count() === 1, 'app left lobby with zero players');
  assert(await page.locator('.gameWrap').count() === 0, 'game started with zero players');
});

await check('E2E: round-total 181 stays visibly invalid and cannot become 18', async () => {
  await reset(false);
  await setRoundMode();
  await startGame();
  const pad = page.locator('.roundTotalKeypad');
  for (const ch of '181') await pad.getByRole('button', { name:ch, exact:true }).click();
  const display = (await page.locator('.roundTotalDisplay').textContent()).trim();
  const ok = pad.getByRole('button', { name:'OK', exact:true });
  assert(display === '181', 'invalid input was silently changed to '+display);
  assert(await ok.isDisabled(), 'OK is enabled for 181');
  const score = (await page.locator('.playerScore').first().textContent()).trim();
  assert(score === '501', 'invalid 181 changed score to '+score);
});

await check('E2E: Classic finished history stores winner remaining score as 0', async () => {
  await reset(false);
  await setAnyOut101();
  await setRoundMode();
  await startGame();
  await enterRound(101);
  await expectWinner();
  const rec = await page.evaluate(() => JSON.parse(localStorage.getItem('finishedGames') || '[]')[0]);
  const winnerRow = rec?.remainingByPlayer?.find(x => x.name === 'Hráč 1');
  assert(winnerRow?.remaining === 0, 'winner remaining='+JSON.stringify(winnerRow));
});

await check('E2E: Chinese share text is Chinese, not English fallback', async () => {
  await reset(false);
  const trigger = page.locator('.themedSelectTrigger').first();
  await choose(trigger, '中文');
  await page.getByRole('button', { name:'分享应用', exact:true }).click();
  const shares = await page.evaluate(() => window.__qa.shares);
  assert(shares.length > 0, 'native share bridge was not called');
  assert(String(shares.at(-1).text).includes('飞镖'), 'Chinese shareText='+JSON.stringify(shares.at(-1).text));
});

await check('E2E: Roulette 0-0 tie is a draw, never Player 1 win', async () => {
  await reset(false);
  await setMode('Ruleta');
  await startGame();
  for (let r=0; r<8; r++) {
    await page.getByRole('button', { name:'Přepnout hráče', exact:true }).click();
    await page.waitForTimeout(35);
    await page.getByRole('button', { name:'Přepnout hráče', exact:true }).click();
    await page.waitForTimeout(35);
  }
  assert(await page.locator('.playerCard.winner').count() === 0, 'tie incorrectly marks a player as winner');
  assert((await page.locator('body').textContent()).includes('Remíza'), 'draw state not shown');
  const rec = await page.evaluate(() => JSON.parse(localStorage.getItem('finishedGames') || '[]')[0]);
  assert(rec?.result === 'draw' && rec?.winner === '', 'draw history='+JSON.stringify(rec));
});

await check('E2E: sound and voice bridge fire when enabled', async () => {
  await reset(false);
  await startGame();
  const before = await page.evaluate(() => ({p:window.__qa.mediaPlays,s:window.__qa.speaks.length}));
  await clickKey(20); await clickKey(20); await clickKey(20);
  await page.waitForTimeout(80);
  const after = await page.evaluate(() => ({p:window.__qa.mediaPlays,s:window.__qa.speaks}));
  assert(after.p > before.p, 'hit sound play() was not called');
  assert(after.s.length > before.s && after.s.some(x => x.text === '60' && x.lang === 'cs'), JSON.stringify(after.s));
});

await check('E2E: voice and sound toggles actually suppress output', async () => {
  await reset(false);
  await page.getByRole('button', { name:'Zvuk', exact:true }).click();
  await page.getByRole('button', { name:'Hlas', exact:true }).click();
  const before = await page.evaluate(() => ({p:window.__qa.mediaPlays,s:window.__qa.speaks.length}));
  await startGame();
  await clickKey(20); await clickKey(20); await clickKey(20);
  await page.waitForTimeout(80);
  const after = await page.evaluate(() => ({p:window.__qa.mediaPlays,s:window.__qa.speaks.length}));
  assert(after.p === before.p, `sound calls changed ${before.p}->${after.p}`);
  assert(after.s === before.s, `voice calls changed ${before.s}->${after.s}`);
});

await check('E2E: all 7 languages switch and render', async () => {
  await reset(true);
  const langs = [
    ['Čeština','cs'],['English','en'],['Deutsch','de'],['Español','es'],['Nederlands','nl'],['Русский','ru'],['中文','zh']
  ];
  for (const [label,code] of langs) {
    const trigger = page.locator('.themedSelectTrigger').first();
    await choose(trigger, label);
    await page.waitForTimeout(30);
    const selected = await page.locator('.themedSelectTrigger').first().textContent();
    assert(selected.includes(label), `${code}: selected=${selected}`);
    assert((await page.locator('body').textContent()).length > 300, `${code}: body unexpectedly empty`);
  }
  return '7/7';
});

await check('E2E: non-Czech languages do not show Czech Premium UI labels', async () => {
  await reset(true);
  const trigger = page.locator('.themedSelectTrigger').first();
  await choose(trigger, 'English');
  const body = await page.locator('body').textContent();
  assert(!body.includes('Vzhled aplikace:'), 'hard-coded Czech "Vzhled aplikace:" visible in English UI');
});

await check('E2E: team mode can complete a match', async () => {
  await reset(false);
  await setAnyOut101();
  await setRoundMode();
  const card = page.locator('.lobbyCard').filter({hasText:'Režim hráčů'}).first();
  await choose(card.locator('.themedSelectTrigger'), 'Týmy');
  await startGame();
  await enterRound(101);
  await expectWinner();
  const winnerText = await page.locator('.playerCard.winner').textContent();
  assert(/Tým A/.test(winnerText), winnerText);
  const rec = await page.evaluate(() => JSON.parse(localStorage.getItem('finishedGames') || '[]')[0]);
  assert(rec?.winner === 'Tým A', 'team history winner='+JSON.stringify(rec?.winner));
});

await check('E2E: Darts Free has no artificial 3-player limit', async () => {
  await reset(false);
  for(let i=0;i<6;i++) await page.getByRole('button',{name:/Přidat hráče/}).click();
  const count = await page.locator('.playerRow').count();
  assert(count === 8, `expected 8 Free players, got ${count}`);
});

await check('E2E: Darts Premium has no artificial 5-player limit', async () => {
  await reset(true);
  for(let i=0;i<8;i++) await page.getByRole('button',{name:/Přidat hráče/}).click();
  const count = await page.locator('.playerRow').count();
  assert(count === 10, `expected 10 Premium players, got ${count}`);
});

await check('E2E: Premium lobby does not offer Activate Premium', async () => {
  await reset(true);
  const btn = page.getByRole('button', {name:'Aktivuj Premium', exact:true});
  assert(await btn.count() === 0, 'Activate Premium button remains visible to Premium owner');
});

await check('STATIC: all seven Android TTS locale mappings exist', async () => {
  for (const tag of ['cs-CZ','en-US','de-DE','es-ES','nl-NL','ru-RU','zh-CN']) {
    assert(javaSource.includes(`return "${tag}"`), `missing ${tag}`);
  }
});

await check('E2E: sound assets are reachable', async () => {
  for (const path of ['/dart-hit.mp3','/tada-fanfare-a-6313.mp3']) {
    const response = await context.request.get(new URL(path, BASE_URL).toString());
    assert(response.ok(), `${path} HTTP ${response.status()}`);
    assert((await response.body()).length > 1000, `${path} too small`);
  }
});

await check('STRESS: 50 additional Classic 101 games complete without state crash', async () => {
  await reset(false);
  await setAnyOut101();
  await setRoundMode();
  await startGame();
  for (let g=0; g<50; g++) {
    await enterRound(101);
    await expectWinner();
    if (g < 49) await restartGame();
  }
  const count = await page.evaluate(() => JSON.parse(localStorage.getItem('finishedGames') || '[]').length);
  assert(count >= 50, 'finishedGames after stress='+count);
  return '50/50';
});

await browser.close();

const pass = results.filter(x=>x.status==='PASS').length;
const fail = results.filter(x=>x.status==='FAIL').length;
fs.mkdirSync('qa-results', {recursive:true});
fs.writeFileSync('qa-results/report.json', JSON.stringify({baseUrl:BASE_URL,pass,fail,results,details},null,2));
const md = [
  '# DartScore Pro v96 Full Regression',
  '',
  `Target: ${BASE_URL}`,
  `Passed: ${pass}`,
  `Failed: ${fail}`,
  '',
  '| Status | Check | Detail |',
  '|---|---|---|',
  ...results.map(r=>`| ${r.status} | ${r.name.replace(/\|/g,'/')} | ${String(r.detail||'').replace(/\|/g,'/').replace(/\n/g,' ')} |`)
].join('\n');
fs.writeFileSync('qa-results/report.md', md);
console.log('\n' + md);
