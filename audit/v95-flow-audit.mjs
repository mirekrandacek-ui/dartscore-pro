import { chromium } from 'playwright';
import fs from 'node:fs';

const results = [];
const record = (name, ok, detail='') => {
  results.push({name, ok, detail});
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (detail ? ' | ' + detail : ''));
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const esc = s => s.replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&');

const source = fs.readFileSync('src/App.jsx','utf8');
const native = fs.readFileSync('app/src/main/java/com/randis2288/dartscorepro/MainWebViewActivity.java','utf8');

try {
  assert(source.includes("window.open(url, '_blank'"), 'rateApp no longer uses window.open');
  assert(!native.includes('setSupportMultipleWindows(true)'), 'WebView unexpectedly enables multiple windows');
  assert(!native.includes('onCreateWindow('), 'WebView unexpectedly handles window.open');
  record('Native rating button regression reproduced statically', true,
    'rateApp uses window.open(_blank), while WebView has no multi-window/onCreateWindow support; call can fail silently.');
} catch(e) { record('Native rating button regression reproduced statically', false, e.message); }

try {
  const zhStart = source.indexOf('  zh: {');
  const zhEnd = source.indexOf('\n  }\n};', zhStart);
  const zh = source.slice(zhStart, zhEnd);
  const missing = ['shareApp:', 'shareText:', 'linkCopied:'].filter(k => !zh.includes(k));
  assert(missing.length === 3, 'Expected known zh missing translation keys were not all missing');
  record('Chinese translation completeness', false, 'Missing zh keys: shareApp, shareText, linkCopied (falls back to English).');
} catch(e) { record('Chinese translation completeness', false, e.message); }

try {
  assert(source.includes("confirmCheckoutRound:"), 'translation key missing');
  const usageCount = (source.match(/confirmCheckoutRound/g) || []).length;
  assert(usageCount === 7, 'Unexpected usage count: '+usageCount);
  assert(source.includes('If it exactly reaches zero, treat it as a valid checkout regardless'), 'round checkout bypass changed');
  record('Round-total checkout obeys Double/Triple-out', false,
    'confirmCheckoutRound is translated but never used; exact zero is accepted regardless of out rule.');
} catch(e) { record('Round-total checkout obeys Double/Triple-out', false, e.message); }

try {
  const hardcoded = ['Vzhled aplikace:', 'Premium aktivováno (test)', 'Google Play nákup není v této verzi dostupný'];
  const found = hardcoded.filter(s => source.includes(s));
  assert(found.length > 0, 'No known hardcoded Czech strings found');
  record('All UI/toasts localized', false, 'Hard-coded Czech remains outside translation table: '+found.join(' | '));
} catch(e) { record('All UI/toasts localized', false, e.message); }

try {
  assert(source.includes("const APP_VERSION = '1.1.19'"), 'APP_VERSION changed');
  record('Internal web APP_VERSION matches Android v95/1.1.61', false,
    "src/App.jsx still says APP_VERSION 1.1.19; lobby defaults therefore are not versioned with Android releases.");
} catch(e) { record('Internal web APP_VERSION matches Android v95/1.1.61', false, e.message); }

const browser = await chromium.launch({headless:true});
const context = await browser.newContext({viewport:{width:412,height:915}});
const page = await context.newPage();
const pageErrors = [];
const consoleErrors = [];
page.on('pageerror', e => pageErrors.push(String(e)));
page.on('console', m => { if (m.type()==='error') consoleErrors.push(m.text()); });

await page.addInitScript(() => {
  const realSetTimeout = window.setTimeout.bind(window);
  const realSetInterval = window.setInterval.bind(window);
  window.setTimeout = (fn, ms, ...args) => realSetTimeout(fn, Math.min(Number(ms)||0, 12), ...args);
  window.setInterval = (fn, ms, ...args) => realSetInterval(fn, Math.min(Number(ms)||0, 12), ...args);
  window.__nativeCalls = {speak:[], share:[], interstitial:0, buy:0, restore:0, premium:[]};
  window.DartScoreAndroid = {
    setPremium(v){ window.__nativeCalls.premium.push(v); },
    speak(text,lang){ window.__nativeCalls.speak.push({text,lang}); },
    shareApp(title,text,url){ window.__nativeCalls.share.push({title,text,url}); },
    showInterstitial(){ window.__nativeCalls.interstitial++; },
    buyPremium(){ window.__nativeCalls.buy++; },
    restorePremium(){ window.__nativeCalls.restore++; },
    isPrivacyOptionsRequired(){ return false; },
    showPrivacyOptions(){}
  };
});

await page.goto('http://127.0.0.1:4173/', {waitUntil:'networkidle'});
await page.evaluate(() => { localStorage.clear(); });
await page.reload({waitUntil:'networkidle'});

const clickButton = async (name, exact=true) => {
  const b = page.getByRole('button',{name, exact});
  await b.first().click();
};
const backLobby = async () => {
  const b = page.locator('.gameTextAction').filter({hasText:/Zpět|Back|Zurück|Atrás|Terug|Назад|返回/});
  if (await b.count()) await b.first().click();
};

try {
  assert(await page.getByText('DartScore Pro',{exact:true}).count() > 0, 'App title missing');
  assert(await page.getByRole('button',{name:'▶ Start hry', exact:true}).count() === 1, 'Start button missing');
  record('Lobby renders', true);
} catch(e) { record('Lobby renders', false, e.message); }

try {
  await page.getByRole('button',{name:'Sdílet aplikaci', exact:true}).click();
  const calls = await page.evaluate(() => window.__nativeCalls.share.length);
  assert(calls===1, 'Native share bridge not called exactly once');
  record('Native share button', true);
} catch(e) { record('Native share button', false, e.message); }

try {
  await page.getByRole('button',{name:'Čeština', exact:true}).click();
  await page.getByRole('option',{name:'中文', exact:true}).click();
  await page.getByRole('button',{name:'Share app', exact:true}).click();
  const last = await page.evaluate(() => window.__nativeCalls.share.at(-1));
  assert(last && /darts scorer/i.test(last.text), 'Expected English fallback not observed');
  record('Chinese share localization', false, 'UI falls back to English "Share app" / share text.');
  await page.getByRole('button',{name:'中文', exact:true}).click();
  await page.getByRole('option',{name:'Čeština', exact:true}).click();
} catch(e) { record('Chinese share localization', false, e.message); }

try {
  await clickButton('101');
  await clickButton('▶ Start hry');
  await clickButton('TRIPLE');
  await clickButton('17');
  await clickButton('50');
  await page.waitForTimeout(30);
  assert(await page.locator('.playerCard.winner').count()===1, 'Winner not detected');
  record('Classic 101 valid checkout T17 + Bull50', true);
} catch(e) { record('Classic 101 valid checkout T17 + Bull50', false, e.message); }

try {
  await clickButton('Opakovat hru');
  await clickButton('20');
  let score = (await page.locator('.playerScore').first().innerText()).trim();
  assert(score==='81', 'Expected 81 after S20, got '+score);
  await page.locator('.multBtn.backspace').click();
  await page.waitForTimeout(20);
  score = (await page.locator('.playerScore').first().innerText()).trim();
  assert(score==='101', 'Undo did not restore 101, got '+score);
  record('Classic undo', true);
} catch(e) { record('Classic undo', false, e.message); }

try {
  await clickButton('Opakovat hru');
  await clickButton('TRIPLE'); await clickButton('20');
  await clickButton('TRIPLE'); await clickButton('20');
  await page.waitForTimeout(30);
  const score = (await page.locator('.playerScore').first().innerText()).trim();
  assert(score==='101', 'Bust failed to restore round-start score, got '+score);
  record('Classic bust restores visit start', true);
} catch(e) { record('Classic bust restores visit start', false, e.message); }

try {
  await backLobby();
  await page.getByRole('button',{name:'Po šipkách', exact:true}).click();
  await page.getByRole('option',{name:'Součet kola', exact:true}).click();
  await clickButton('▶ Start hry');
  await clickButton('1'); await clickButton('0'); await clickButton('1'); await clickButton('OK');
  await page.waitForTimeout(30);
  const won = await page.locator('.playerCard.winner').count()===1;
  if (won) record('Round-total exact zero respects Double-out', false, '101 entered as round total wins immediately despite Double-out; no checkout confirmation.');
  else record('Round-total exact zero respects Double-out', true);
} catch(e) { record('Round-total exact zero respects Double-out', false, e.message); }

try {
  await backLobby();
  await page.getByRole('button',{name:'Součet kola', exact:true}).click();
  await page.getByRole('option',{name:'Po šipkách', exact:true}).click();
  await page.getByRole('button',{name:'Klasická hra', exact:true}).click();
  await page.getByRole('option',{name:'Cricket', exact:true}).click();
  await clickButton('▶ Start hry');
  assert(await page.locator('.cricketWrap').count()===1, 'Cricket board missing');
  await clickButton('TRIPLE'); await clickButton('20');
  await page.waitForTimeout(20);
  assert((await page.locator('.markCell').filter({hasText:'Ⓧ'}).count())>=1, 'T20 did not close target');
  record('Cricket basic scoring T20 closes 20', true);
} catch(e) { record('Cricket basic scoring T20 closes 20', false, e.message); }

try {
  await backLobby();
  await page.getByRole('button',{name:'Cricket', exact:true}).click();
  await page.getByRole('option',{name:'Around the Clock', exact:true}).click();
  await clickButton('▶ Start hry');
  const before = (await page.locator('.aroundTargetBox').first().innerText()).trim();
  await clickButton('1');
  await page.waitForTimeout(20);
  const after = (await page.locator('.aroundTargetBox').first().innerText()).trim();
  assert(before==='1' && after==='2', 'Around target did not advance 1→2 ('+before+'→'+after+')');
  record('Around the Clock target progression', true);
} catch(e) { record('Around the Clock target progression', false, e.message); }

try {
  await backLobby();
  await page.getByRole('button',{name:'Around the Clock', exact:true}).click();
  await page.getByRole('option',{name:'Ruleta', exact:true}).click();
  await clickButton('▶ Start hry');
  assert(await page.getByRole('button',{name:'Losovat', exact:true}).count()===1, 'Roulette draw missing');
  await clickButton('Losovat');
  await page.waitForTimeout(80);
  const hit=page.getByRole('button',{name:'Zásah +1', exact:true});
  assert(!(await hit.isDisabled()), 'Roulette hit remained disabled after draw');
  await hit.click();
  record('Roulette draw + hit flow', true);
} catch(e) { record('Roulette draw + hit flow', false, e.message); }

try {
  await backLobby();
  await page.getByRole('button',{name:'Ruleta', exact:true}).click();
  await page.getByRole('option',{name:'Ruleta Double', exact:true}).click();
  await clickButton('▶ Start hry');
  await clickButton('Losovat');
  await page.waitForTimeout(80);
  const hit=page.getByRole('button',{name:'Zásah +1', exact:true});
  assert(!(await hit.isDisabled()), 'Roulette Double hit remained disabled after draw');
  await hit.click();
  record('Roulette Double draw + hit flow', true);
} catch(e) { record('Roulette Double draw + hit flow', false, e.message); }

try {
  await backLobby();
  const sequence=[['Čeština','English'],['English','Deutsch'],['Deutsch','Español'],['Español','Nederlands'],['Nederlands','Русский'],['Русский','中文'],['中文','Čeština']];
  for(const [cur,opt] of sequence){
    await page.getByRole('button',{name:cur, exact:true}).click();
    await page.getByRole('option',{name:opt, exact:true}).click();
    assert(await page.getByText('DartScore Pro',{exact:true}).count()>0,'App disappeared after '+opt);
  }
  record('All 7 language switches render', true);
} catch(e) { record('All 7 language switches render', false, e.message); }

try {
  const voiceBtn=page.getByRole('button',{name:'Hlas', exact:true});
  if(await voiceBtn.count()) await voiceBtn.click();
  const modeBtn=page.getByRole('button',{name:'Ruleta Double', exact:true});
  if(await modeBtn.count()){
    await modeBtn.click(); await page.getByRole('option',{name:'Klasická hra',exact:true}).click();
  }
  await clickButton('101'); await clickButton('▶ Start hry');
  await clickButton('1'); await clickButton('1'); await clickButton('1');
  await page.waitForTimeout(30);
  const speakCalls=await page.evaluate(()=>window.__nativeCalls.speak.length);
  assert(speakCalls>0,'No native TTS speak call after completed visit');
  record('Voice bridge is called from game flow', true, 'speak calls='+speakCalls);
} catch(e) { record('Voice bridge is called from game flow', false, e.message); }

try {
  await clickButton('Opakovat hru');
  let n=0;
  for(;n<100;n++){
    await clickButton('TRIPLE'); await clickButton('17'); await clickButton('50');
    await page.waitForTimeout(4);
    assert(await page.locator('.playerCard.winner').count()===1, 'No winner at loop '+n);
    await clickButton('Opakovat hru');
  }
  record('100 repeated Classic matches without state crash', true);
} catch(e) { record('100 repeated Classic matches without state crash', false, e.message); }

try {
  assert(pageErrors.length===0, 'Page errors: '+pageErrors.join(' || '));
  record('No uncaught browser page errors during audited flows', true);
} catch(e) { record('No uncaught browser page errors during audited flows', false, e.message); }

await browser.close();

const summary = {
  passed: results.filter(x=>x.ok).length,
  failed: results.filter(x=>!x.ok).length,
  results,
  pageErrors,
  consoleErrors: consoleErrors.slice(0,50)
};
fs.writeFileSync('audit-v95-results.json', JSON.stringify(summary,null,2));
console.log('AUDIT_JSON '+JSON.stringify(summary));
