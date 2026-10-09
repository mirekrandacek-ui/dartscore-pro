import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE_URL || 'https://dartscore-pro.vercel.app/';
const REPORT_PREFIX = process.env.REPORT_PREFIX || 'qa-v95';
const results = [];
const diagnostics = [];

function addResult(name, status, detail='') {
  results.push({ name, status, detail });
  console.log(`[${status}] ${name}${detail ? ' — ' + detail : ''}`);
}
async function test(name, fn) {
  try {
    await fn();
    addResult(name, 'PASS');
  } catch (e) {
    addResult(name, 'FAIL', e?.message || String(e));
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}
async function wait(ms=120) { await new Promise(r => setTimeout(r, ms)); }

const browser = await chromium.launch({ headless: true });

async function makePage({ premium=false, locale='cs-CZ' } = {}) {
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    locale,
    userAgent: 'Mozilla/5.0 (Linux; Android 15; SM-S911B Build/AP3A.240905.015.A2; wv) AppleWebKit/537.36 Version/4.0 Chrome/140.0.0.0 Mobile Safari/537.36',
  });
  await context.addInitScript(({ premium }) => {
    window.__nativeCalls = { speak: [], interstitial: 0, share: [], premium: [], buy: 0, restore: 0 };
    window.DartScoreAndroid = {
      speak(text, lang) { window.__nativeCalls.speak.push({ text: String(text), lang: String(lang) }); },
      showInterstitial() { window.__nativeCalls.interstitial += 1; },
      shareApp(title, text, url) { window.__nativeCalls.share.push({title, text, url}); },
      setPremium(v) { window.__nativeCalls.premium.push(Boolean(v)); },
      buyPremium() { window.__nativeCalls.buy += 1; },
      restorePremium() { window.__nativeCalls.restore += 1; },
      isPrivacyOptionsRequired() { return false; },
      showPrivacyOptions() {}
    };
    try {
      if (premium) localStorage.setItem('premium', 'true');
    } catch {}
  }, { premium });

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(350);
  return { context, page, errors };
}

async function clean(page, { premium=false } = {}) {
  await page.evaluate(({premium}) => {
    localStorage.clear();
    if (premium) localStorage.setItem('premium','true');
    window.__nativeCalls.speak = [];
    window.__nativeCalls.interstitial = 0;
    window.__nativeCalls.share = [];
    window.__nativeCalls.premium = [];
  }, {premium});
  await page.reload({waitUntil:'networkidle'});
  await page.waitForTimeout(250);
}

async function chooseTrigger(page, trigger, optionText) {
  await trigger.click();
  const option = page.getByRole('option', { name: optionText, exact: true });
  await option.waitFor({state:'visible', timeout:5000});
  await option.click();
  await page.waitForTimeout(80);
}

async function chooseByLabel(page, labelText, optionText) {
  const label = page.getByText(labelText, {exact:true}).first();
  const parent = label.locator('xpath=..');
  const trigger = parent.locator('button.themedSelectTrigger').first();
  await chooseTrigger(page, trigger, optionText);
}

async function chooseLanguage(page, label) {
  await chooseTrigger(page, page.locator('button.themedSelectTrigger').first(), label);
}

async function start101(page) {
  await page.getByRole('button', {name:'101', exact:true}).click();
  await page.getByRole('button', {name:/Start hry/, exact:false}).click();
  await page.waitForTimeout(120);
}

async function key(page, n) {
  await page.getByRole('button', {name:String(n), exact:true}).last().click();
  await page.waitForTimeout(45);
}
async function mult(page, name) {
  await page.getByRole('button', {name, exact:true}).click();
  await page.waitForTimeout(40);
}
async function finish101Any(page) { await key(page,1); await mult(page,'TRIPLE'); await key(page,20); await mult(page,'DOUBLE'); await key(page,20); }
async function finish101Double(page) { await key(page,1); await mult(page,'TRIPLE'); await key(page,20); await mult(page,'DOUBLE'); await key(page,20); }
async function finish101Triple(page) { await key(page,1); await mult(page,'DOUBLE'); await key(page,20); await mult(page,'TRIPLE'); await key(page,20); }

async function activeName(page) {
  return (await page.locator('.playerCard.active .playerNameText').first().innerText()).trim();
}
async function activeScore(page) {
  return Number((await page.locator('.playerCard.active .playerScore').first().innerText()).trim());
}
async function allPlayerScores(page) {
  return await page.locator('.playerCard .playerScore').allTextContents().then(a=>a.map(x=>Number(x.trim())));
}
async function roundEnter(page, number) {
  for (const ch of String(number)) await page.getByRole('button',{name:ch,exact:true}).last().click();
  await page.getByRole('button',{name:'OK',exact:true}).click();
  await page.waitForTimeout(350);
}

await test('Produkční appka se načte bez JS pádu', async () => {
  const {context,page,errors}=await makePage();
  assert(await page.getByText('DartScore Pro',{exact:true}).count()>=1,'Chybí hlavička');
  assert(errors.length===0, errors.join(' | '));
  await context.close();
});

await test('Zvukové soubory jsou dostupné', async () => {
  const {context,page}=await makePage();
  const a = await page.request.get(BASE+'dart-hit.mp3');
  const b = await page.request.get(BASE+'tada-fanfare-a-6313.mp3');
  assert(a.ok(), 'dart-hit.mp3 HTTP '+a.status());
  assert(b.ok(), 'fanfára HTTP '+b.status());
  await context.close();
});

await test('Sdílení aplikace volá nativní Android bridge', async () => {
  const {context,page}=await makePage();
  await page.getByRole('button',{name:'Sdílet aplikaci',exact:true}).click();
  const calls=await page.evaluate(()=>window.__nativeCalls.share);
  assert(calls.length===1,'shareApp nebyl zavolán přes bridge');
  assert(calls[0].url.includes('com.randis2288.dartscorepro'),'Špatný Play Store URL');
  await context.close();
});

await test('Tlačítko recenze funguje i ve WebView bez popup oken', async () => {
  const {context,page}=await makePage();
  await page.evaluate(()=>{ window.open = () => null; });
  const before=page.url();
  await page.getByRole('button',{name:/Líbí se ti aplikace/,exact:false}).click();
  await page.waitForTimeout(400);
  const after=page.url();
  assert(after!==before || after.includes('play.google.com'), 'Klik nic neudělá, když WebView nepodporuje window.open(_blank)');
  await context.close();
});

const langCases = [
  ['Čeština','⭐ Líbí se ti aplikace?','▶ Start hry'],
  ['English','⭐ Do you like the app?','▶ Start Game'],
  ['Deutsch','⭐ Gefällt dir die App?','▶ Spiel starten'],
  ['Español','⭐ ¿Te gusta la app?','▶ Empezar'],
  ['Nederlands','⭐ Vind je de app leuk?','▶ Start spel'],
  ['Русский','⭐ Нравится приложение?','▶ Начать игру'],
  ['中文','⭐ 喜欢这个应用吗？','▶ 开始游戏'],
];
await test('Všech 7 jazyků přepíná hlavní lobby texty', async () => {
  const {context,page}=await makePage();
  for (const [label,rate,start] of langCases) {
    await chooseLanguage(page,label);
    assert(await page.getByRole('button',{name:rate,exact:true}).count()===1, label+': chybí překlad ratingu');
    assert(await page.getByRole('button',{name:start,exact:true}).count()===1, label+': chybí překlad Start');
  }
  await context.close();
});

await test('Automatická jména hráčů se překládají se změnou jazyka', async () => {
  const {context,page}=await makePage();
  await chooseLanguage(page,'English');
  const vals=await page.locator('.playerName input').evaluateAll(es=>es.map(e=>e.value));
  assert(vals[0]==='Player 1' && vals[1]==='Player 2','EN jména: '+JSON.stringify(vals));
  await chooseLanguage(page,'Deutsch');
  const vals2=await page.locator('.playerName input').evaluateAll(es=>es.map(e=>e.value));
  assert(vals2[0]==='Spieler 1' && vals2[1]==='Spieler 2','DE jména: '+JSON.stringify(vals2));
  await context.close();
});

await test('Premium UI nemá viditelný český text po přepnutí do EN', async () => {
  const {context,page}=await makePage({premium:true});
  await chooseLanguage(page,'English');
  const body=await page.locator('body').innerText();
  assert(!body.includes('Vzhled aplikace:'),'Premium obsahuje nepřeložené „Vzhled aplikace:“');
  await context.close();
});

await test('Hlasový bridge dostává správný jazyk ve všech 7 jazycích', async () => {
  const tags=[['Čeština','cs'],['English','en'],['Deutsch','de'],['Español','es'],['Nederlands','nl'],['Русский','ru'],['中文','zh']];
  for (const [label,code] of tags) {
    const {context,page}=await makePage();
    if (label!=='Čeština') await chooseLanguage(page,label);
    const startLabel = langCases.find(x=>x[0]===label)[2];
    await page.getByRole('button',{name:'101',exact:true}).click();
    await page.getByRole('button',{name:startLabel,exact:true}).click();
    await key(page,0); await key(page,0); await key(page,0);
    await page.waitForTimeout(650);
    const calls=await page.evaluate(()=>window.__nativeCalls.speak);
    assert(calls.some(c=>c.lang===code),label+': žádný speak('+code+') '+JSON.stringify(calls));
    await context.close();
  }
});

await test('Classic: 3 hody správně odečtou skóre a přepnou hráče', async () => {
  const {context,page}=await makePage();
  await page.getByRole('button',{name:/Start hry/}).click();
  await key(page,20); await key(page,20); await key(page,20);
  await page.waitForTimeout(650);
  const scores=await allPlayerScores(page);
  assert(scores[0]===441,'Hráč 1 má '+scores[0]+' místo 441');
  assert(await activeName(page)==='Hráč 2','Nepřepnulo na Hráče 2');
  await context.close();
});

await test('Classic: Undo po přepnutí vrátí třetí šipku i aktivního hráče', async () => {
  const {context,page}=await makePage();
  await page.getByRole('button',{name:/Start hry/}).click();
  await key(page,20); await key(page,20); await key(page,20);
  await page.waitForTimeout(650);
  await page.getByRole('button',{name:'Zpět',exact:true}).last().click();
  await page.waitForTimeout(150);
  const scores=await allPlayerScores(page);
  assert(scores[0]===461,'Po Undo očekávám 461, mám '+scores[0]);
  assert(await activeName(page)==='Hráč 1','Undo nevrátilo Hráče 1');
  await context.close();
});

await test('Classic ANY-OUT: 101 lze korektně zavřít', async () => {
  const {context,page}=await makePage();
  await start101(page); await finish101Any(page); await page.waitForTimeout(200);
  assert(await page.locator('.playerCard.winner').count()===1,'Nevznikl vítěz');
  await context.close();
});

await test('Classic DOUBLE-OUT: platný double checkout vyhraje', async () => {
  const {context,page}=await makePage();
  await page.getByText('Double-out',{exact:true}).locator('input').check();
  await start101(page); await finish101Double(page); await page.waitForTimeout(200);
  assert(await page.locator('.playerCard.winner').count()===1,'Platný D20 checkout nebyl uznán');
  await context.close();
});

await test('Classic DOUBLE-OUT: neplatný single checkout je bust', async () => {
  const {context,page}=await makePage();
  await page.getByText('Double-out',{exact:true}).locator('input').check();
  await start101(page);
  await key(page,50);
  await mult(page,'DOUBLE'); await key(page,20);
  await key(page,11);
  await page.waitForTimeout(400);
  const scores=await allPlayerScores(page);
  assert(scores[0]===101,'Bust nevrátil skóre na 101: '+scores[0]);
  assert(await page.locator('.playerCard.winner').count()===0,'Neplatný single checkout vytvořil vítěze');
  await context.close();
});

await test('Classic TRIPLE-OUT: platný triple checkout vyhraje', async () => {
  const {context,page}=await makePage();
  await page.getByText('Triple-out',{exact:true}).locator('input').check();
  await start101(page); await finish101Triple(page); await page.waitForTimeout(200);
  assert(await page.locator('.playerCard.winner').count()===1,'Platný T20 checkout nebyl uznán');
  await context.close();
});

await test('Classic DOUBLE-OUT: ponechání 1 je bust', async () => {
  const {context,page}=await makePage();
  await page.getByText('Double-out',{exact:true}).locator('input').check();
  await start101(page);
  await mult(page,'TRIPLE'); await key(page,20);
  await mult(page,'DOUBLE'); await key(page,20);
  await page.waitForTimeout(400);
  const scores=await allPlayerScores(page);
  assert(scores[0]===101,'Leaving-one bust nevrátil 101: '+scores[0]);
  await context.close();
});

await test('Classic DOUBLE-OUT: Bull 50 lze použít jako double bull checkout', async () => {
  const {context,page}=await makePage();
  await page.getByText('Double-out',{exact:true}).locator('input').check();
  await start101(page);
  await key(page,50); await key(page,1); await key(page,50);
  await page.waitForTimeout(200);
  assert(await page.locator('.playerCard.winner').count()===1,'Bull 50 nebyl uznán jako double checkout');
  await context.close();
});

await test('Součet kola: běžný nához odečte skóre a přepne hráče', async () => {
  const {context,page}=await makePage();
  await chooseByLabel(page,'Typ počítání','Součet kola');
  await page.getByRole('button',{name:/Start hry/}).click();
  await roundEnter(page,60);
  const scores=await allPlayerScores(page);
  assert(scores[0]===441,'60 z 501 nedalo 441: '+scores[0]);
  assert(await activeName(page)==='Hráč 2','Součet kola nepřepnul hráče');
  await context.close();
});

await test('Součet kola + DOUBLE-OUT: exact zero nesmí automaticky obejít checkout pravidlo', async () => {
  const {context,page}=await makePage();
  await page.getByText('Double-out',{exact:true}).locator('input').check();
  await chooseByLabel(page,'Typ počítání','Součet kola');
  await page.getByRole('button',{name:'101',exact:true}).click();
  await page.getByRole('button',{name:/Start hry/}).click();
  let sawConfirm=false;
  page.once('dialog', async dialog => { sawConfirm=true; await dialog.dismiss(); });
  await roundEnter(page,101);
  assert(sawConfirm,'Při Double-out v Součtu kola se neobjevil dotaz na platný checkout');
  assert(await page.locator('.playerCard.winner').count()===0,'101 po zamítnutí checkoutu bylo uznáno jako výhra');
  await context.close();
});

await test('Legy: po výhře legu se skóre resetuje a další leg pokračuje', async () => {
  const {context,page}=await makePage();
  await chooseByLabel(page,'Legy','2');
  await start101(page); await finish101Any(page);
  await page.waitForTimeout(900);
  assert(await page.locator('.playerCard.winner').count()===0,'Po 1. legu z 2 vznikl vítěz zápasu');
  const scores=await allPlayerScores(page);
  assert(scores[0]===101 && scores[1]===101,'Skóre se po legu neresetovalo: '+scores);
  const txt=await page.locator('.classicMatchProgress').first().innerText();
  assert(txt.includes('Legy 1/2'),'Počítadlo legů: '+txt);
  await context.close();
});

await test('Dohrávat kolo: výhra se neuzavře okamžitě před dohráním soupeře', async () => {
  const {context,page}=await makePage();
  await page.getByText('Dohrávat kolo',{exact:true}).locator('input').check();
  await start101(page); await finish101Any(page);
  await page.waitForTimeout(250);
  assert(await page.locator('.playerCard.winner').count()===0,'Výhra se uzavřela dřív než soupeř dohrál kolo');
  // soupeř odehraje tři nuly
  await key(page,0); await key(page,0); await key(page,0);
  await page.waitForTimeout(800);
  assert(await page.locator('.playerCard.winner').count()===1,'Po dohrání kola se výhra neuzavřela');
  await context.close();
});

await test('Týmový režim: sdílené týmové skóre a střídání týmů', async () => {
  const {context,page}=await makePage();
  await chooseByLabel(page,'Režim hráčů','Týmy');
  await page.getByRole('button',{name:/Start hry/}).click();
  assert(await page.locator('.playersPane .playerCard').count()===2,'Se dvěma hráči mají být 2 aktivní týmy');
  await key(page,20); await key(page,20); await key(page,20);
  await page.waitForTimeout(650);
  const names=await page.locator('.playerCard.active .playerNameText').allTextContents();
  assert(names.some(n=>n.includes('Tým B')),'Po týmu A nenásleduje tým B: '+names);
  await context.close();
});

await test('Cricket: 3× T20 zavře 20 a overflow boduje proti otevřenému soupeři', async () => {
  const {context,page}=await makePage();
  await chooseByLabel(page,'Režim','Cricket');
  await page.getByRole('button',{name:/Start hry/}).click();
  // T20: první triple zavře, další dva triple dávají po 60; po 3 darts switch
  for (let i=0;i<3;i++){ await mult(page,'TRIPLE'); await key(page,20); }
  await page.waitForTimeout(500);
  const firstCol=page.locator('.playerCol').first();
  const marks=await firstCol.locator('.markCell').allTextContents();
  const pts=Number((await firstCol.locator('.playerColPts').innerText()).trim());
  assert((marks[5]||'').trim()==='Ⓧ','20 není zavřená: '+JSON.stringify(marks));
  assert(pts===120,'Overflow T20 body mají být 120, jsou '+pts);
  await context.close();
});

await test('Cricket: Undo vrátí mark/body', async () => {
  const {context,page}=await makePage();
  await chooseByLabel(page,'Režim','Cricket');
  await page.getByRole('button',{name:/Start hry/}).click();
  await mult(page,'TRIPLE'); await key(page,20);
  await page.getByRole('button',{name:'Zpět',exact:true}).last().click();
  await page.waitForTimeout(100);
  const firstCol=page.locator('.playerCol').first();
  const marks=await firstCol.locator('.markCell').allTextContents();
  assert((marks[5]||'').trim()==='','Undo nevrátil mark 20: '+JSON.stringify(marks));
  await context.close();
});

await test('Around the Clock: správný cíl postoupí, chybný ne', async () => {
  const {context,page}=await makePage();
  await chooseByLabel(page,'Režim','Around the Clock');
  await page.getByRole('button',{name:/Start hry/}).click();
  await key(page,2);
  let target=(await page.locator('.playerCard.active .aroundTargetBox').innerText()).trim();
  assert(target==='1','Miss na 2 změnil cíl z 1 na '+target);
  await key(page,1);
  target=(await page.locator('.playerCard.active .aroundTargetBox').innerText()).trim();
  assert(target==='2','Hit 1 neposunul cíl na 2: '+target);
  await context.close();
});

await test('Around the Clock: double/triple aktuálního čísla se počítá jako zásah', async () => {
  const {context,page}=await makePage();
  await chooseByLabel(page,'Režim','Around the Clock');
  await page.getByRole('button',{name:/Start hry/}).click();
  await mult(page,'DOUBLE'); await key(page,1);
  let target=(await page.locator('.playerCard.active .aroundTargetBox').innerText()).trim();
  assert(target==='2','D1 neposunulo na 2');
  await mult(page,'TRIPLE'); await key(page,2);
  target=(await page.locator('.playerCard.active .aroundTargetBox').innerText()).trim();
  assert(target==='3','T2 neposunulo na 3');
  await context.close();
});

await test('Roulette: losování vytvoří cíl, zásah přidá bod', async () => {
  const {context,page}=await makePage();
  await chooseByLabel(page,'Režim','Ruleta');
  await page.getByRole('button',{name:/Start hry/}).click();
  await page.getByRole('button',{name:'Losovat',exact:true}).click();
  await page.waitForTimeout(3300);
  const target=(await page.locator('.playerCard.active .rouletteTargetBox').innerText()).trim();
  assert(target!=='-' && target.length>0,'Po losování není cíl');
  await page.getByRole('button',{name:'Zásah +1',exact:true}).click();
  await page.waitForTimeout(120);
  const score=(await page.locator('.playerCard.active .rouletteScore').innerText()).trim();
  assert(score.includes('1'),'Zásah nepřidal bod: '+score);
  await context.close();
});

await test('Roulette Double: nelosuje Bull', async () => {
  const {context,page}=await makePage();
  await chooseByLabel(page,'Režim','Ruleta Double');
  await page.getByRole('button',{name:/Start hry/}).click();
  for (let i=0;i<4;i++){
    await page.getByRole('button',{name:'Losovat',exact:true}).click();
    await page.waitForTimeout(3200);
    const target=(await page.locator('.playerCard.active .rouletteTargetBox').innerText()).trim();
    assert(!target.includes('Bull'),'Double ruleta vylosovala '+target);
    await page.getByRole('button',{name:'Přepnout hráče',exact:true}).click();
    await page.waitForTimeout(450);
  }
  await context.close();
});

await test('Uložení/obnova Classic: rozehraná hra přežije návrat do lobby', async () => {
  const {context,page}=await makePage();
  await page.getByRole('button',{name:/Start hry/}).click();
  await key(page,20);
  await page.getByRole('button',{name:'Zpět',exact:true}).first().click();
  await page.waitForTimeout(150);
  assert(await page.getByRole('button',{name:'Pokračovat ve hře',exact:true}).count()===1,'Chybí Pokračovat ve hře');
  await page.getByRole('button',{name:'Pokračovat ve hře',exact:true}).click();
  await page.waitForTimeout(100);
  const scores=await allPlayerScores(page);
  assert(scores[0]===481,'Obnovené skóre není 481: '+scores[0]);
  await context.close();
});

await test('Roulette snapshot ukládá právě vylosovaný cíl', async () => {
  const {context,page}=await makePage();
  await chooseByLabel(page,'Režim','Ruleta');
  await page.getByRole('button',{name:/Start hry/}).click();
  await page.getByRole('button',{name:'Losovat',exact:true}).click();
  await page.waitForTimeout(3300);
  const before=(await page.locator('.playerCard.active .rouletteTargetBox').innerText()).trim();
  await page.getByRole('button',{name:'Zpět',exact:true}).first().click();
  await page.waitForTimeout(120);
  await page.getByRole('button',{name:'Pokračovat ve hře',exact:true}).click();
  await page.waitForTimeout(120);
  const after=(await page.locator('.playerCard.active .rouletteTargetBox').innerText()).trim();
  assert(after===before,'Roulette cíl se po obnově změnil: '+before+' -> '+after);
  await context.close();
});

await test('Interstitial cadence: 3. explicitní Start nastaví pending, Restart se nepočítá', async () => {
  const {context,page}=await makePage();
  // vypni zvuk, aby případný trigger nečekal na fanfáru
  await page.getByRole('button',{name:'Zvuk',exact:true}).click();
  for(let i=1;i<=2;i++){
    await start101(page);
    await page.getByRole('button',{name:'Zpět',exact:true}).first().click();
    await page.waitForTimeout(80);
    const c=await page.evaluate(()=>localStorage.getItem('interstitialStartCount'));
    assert(c===String(i),'Po Start '+i+' count='+c);
  }
  await start101(page);
  let st=await page.evaluate(()=>({c:localStorage.getItem('interstitialStartCount'),p:localStorage.getItem('interstitialPending')}));
  assert(st.c==='0' && st.p==='true','Po 3. Start není pending: '+JSON.stringify(st));
  await page.getByRole('button',{name:'Opakovat hru',exact:true}).click();
  await page.waitForTimeout(100);
  st=await page.evaluate(()=>({c:localStorage.getItem('interstitialStartCount'),p:localStorage.getItem('interstitialPending')}));
  assert(st.c==='0' && st.p==='true','Restart změnil cadence: '+JSON.stringify(st));
  await context.close();
});

await test('Interstitial pending se spotřebuje až po dokončené hře', async () => {
  const {context,page}=await makePage();
  await page.getByRole('button',{name:'Zvuk',exact:true}).click();
  await page.evaluate(()=>{localStorage.setItem('interstitialPending','true');localStorage.setItem('interstitialStartCount','0');});
  await start101(page);
  await finish101Any(page);
  await page.waitForTimeout(500);
  const st=await page.evaluate(()=>({calls:window.__nativeCalls.interstitial,p:localStorage.getItem('interstitialPending')}));
  assert(st.calls===1,'showInterstitial nebyl zavolán: '+JSON.stringify(st));
  assert(st.p==='false','Pending nezmizel: '+JSON.stringify(st));
  await context.close();
});

await test('Premium: interstitial cadence se nepočítá a bridge dostane Premium=true', async () => {
  const {context,page}=await makePage({premium:true});
  await page.getByRole('button',{name:/Start hry/}).click();
  const st=await page.evaluate(()=>({c:localStorage.getItem('interstitialStartCount'),p:localStorage.getItem('interstitialPending'),prem:window.__nativeCalls.premium}));
  assert(st.c==='0' || st.c===null,'Premium count='+st.c);
  assert(st.p==='false' || st.p===null,'Premium pending='+st.p);
  assert(st.prem.includes(true),'Native bridge nedostal Premium=true');
  await context.close();
});

await test('Free lobby umožní přidat více než 3 hráče (pozor na produktový limit)', async () => {
  const {context,page}=await makePage();
  for(let i=0;i<4;i++) await page.getByRole('button',{name:/Přidat hráče/,exact:false}).click();
  const count=await page.locator('.playerRow').count();
  diagnostics.push({name:'freePlayerCountAfterAdds',value:count});
  assert(count<=3,'Free dovolilo '+count+' hráčů');
  await context.close();
});

await test('Robot Beginner se přidá do lobby a po lidském tahu automaticky odehraje', async () => {
  const {context,page}=await makePage();
  await chooseByLabel(page,'Robot','Začátečník');
  assert((await page.locator('.playerRow').count())===3,'Robot se nepřidal jako 3. hráč');
  await page.getByRole('button',{name:/Start hry/}).click();
  // Hráč 1 tři nuly
  await key(page,0); await key(page,0); await key(page,0);
  await page.waitForTimeout(600);
  // Hráč 2 tři nuly
  await key(page,0); await key(page,0); await key(page,0);
  await page.waitForTimeout(3000);
  const cards=await page.locator('.playerCard').allTextContents();
  const botCard=cards.find(x=>x.includes('🤖'));
  assert(botCard && !botCard.includes('0 šipek'),'Robot neodehrál automatický tah: '+botCard);
  await context.close();
});

await test('FinishedGames: vítěz Classic má po checkoutu remaining=0', async () => {
  const {context,page}=await makePage();
  await start101(page); await finish101Any(page); await page.waitForTimeout(150);
  const rec=await page.evaluate(()=>JSON.parse(localStorage.getItem('finishedGames')||'[]')[0]);
  assert(rec && rec.remainingByPlayer && rec.remainingByPlayer[0]?.remaining===0,'Uložený remaining vítěze='+JSON.stringify(rec?.remainingByPlayer));
  await context.close();
});

await test('FinishedGames: týmová výhra ukládá vítězný tým, ne náhodné jméno hráče', async () => {
  const {context,page}=await makePage();
  await chooseByLabel(page,'Režim hráčů','Týmy');
  await page.getByRole('button',{name:'101',exact:true}).click();
  await page.getByRole('button',{name:/Start hry/}).click();
  await finish101Any(page); await page.waitForTimeout(150);
  const rec=await page.evaluate(()=>JSON.parse(localStorage.getItem('finishedGames')||'[]')[0]);
  assert(rec?.winner==='Tým A','Týmová výhra uložila winner='+JSON.stringify(rec?.winner));
  await context.close();
});


await test('Startovní skóre 101/301/501/701/901 se skutečně nastaví', async () => {
  for (const score of [101,301,501,701,901]) {
    const {context,page}=await makePage();
    if (score!==501) await page.getByRole('button',{name:String(score),exact:true}).click();
    await page.getByRole('button',{name:/Start hry/}).click();
    assert(await activeScore(page)===score,'Start '+score+' otevřel skóre '+await activeScore(page));
    await context.close();
  }
});

await test('Lze hrát sólo s jedním hráčem', async () => {
  const {context,page}=await makePage();
  await page.locator('.playerRow').nth(1).locator('button.trash').click();
  assert(await page.locator('.playerRow').count()===1,'Nezůstal přesně 1 hráč');
  await page.getByRole('button',{name:/Start hry/}).click();
  await key(page,20); await key(page,20); await key(page,20);
  await page.waitForTimeout(450);
  assert(await activeName(page)==='Hráč 1','Sólo hra nemá stále Hráče 1');
  assert(await activeScore(page)===441,'Sólo skóre '+await activeScore(page));
  await context.close();
});

await test('Nulový počet hráčů nesmí spustit hru', async () => {
  const {context,page}=await makePage();
  while(await page.locator('.playerRow').count()) {
    await page.locator('.playerRow').first().locator('button.trash').click();
  }
  await page.getByRole('button',{name:/Start hry/}).click();
  await page.waitForTimeout(100);
  assert(await page.locator('.playerCard').count()>0 || await page.getByRole('button',{name:/Start hry/}).count()===1,
    'Hra se spustila bez jediného hráče a bez validace');
  await context.close();
});

await test('Pět hráčů se střídá přesně v pořadí 1→2→3→4→5→1', async () => {
  const {context,page}=await makePage();
  for(let i=0;i<3;i++) await page.getByRole('button',{name:/Přidat hráče/}).click();
  await page.getByRole('button',{name:/Start hry/}).click();
  for(let i=1;i<=5;i++){
    assert(await activeName(page)===`Hráč ${i}`,'Čekám Hráč '+i+', aktivní '+await activeName(page));
    await key(page,0); await key(page,0); await key(page,0);
    await page.waitForTimeout(450);
  }
  assert(await activeName(page)==='Hráč 1','Po pátém hráči se nevrátil Hráč 1');
  await context.close();
});

await test('Přesun hráče nahoru/dolů mění pořadí bez ztráty hráče', async () => {
  const {context,page}=await makePage();
  await page.getByRole('button',{name:/Přidat hráče/}).click();
  const rows=page.locator('.playerRow');
  const before=await rows.locator('input').evaluateAll(es=>es.map(e=>e.value));
  await rows.nth(2).getByTitle('Up').click();
  const after=await rows.locator('input').evaluateAll(es=>es.map(e=>e.value));
  assert(before.join('|')==='Hráč 1|Hráč 2|Hráč 3','Neočekávaný výchozí seznam '+before);
  assert(after.join('|')==='Hráč 1|Hráč 3|Hráč 2','Up neprohodil pořadí '+after);
  await context.close();
});

await test('Týmový režim odmítne konfiguraci s jediným aktivním týmem', async () => {
  const {context,page}=await makePage();
  await chooseByLabel(page,'Režim hráčů','Týmy');
  const teamTriggers=page.locator('.playerRow button.themedSelectTrigger');
  await chooseTrigger(page,teamTriggers.nth(1),'Tým A');
  let alertText='';
  page.once('dialog', async d=>{alertText=d.message(); await d.dismiss();});
  await page.getByRole('button',{name:/Start hry/}).click();
  await page.waitForTimeout(80);
  assert(alertText.includes('Alespoň dva týmy'),'Chybí validace týmů, alert='+alertText);
  assert(await page.getByRole('button',{name:/Start hry/}).count()===1,'Po invalidní konfiguraci app opustila lobby');
  await context.close();
});

await test('Součet kola odmítne hodnotu nad 180', async () => {
  const {context,page}=await makePage();
  await chooseByLabel(page,'Typ počítání','Součet kola');
  await page.getByRole('button',{name:/Start hry/}).click();
  await roundEnter(page,181);
  await page.waitForTimeout(100);
  assert(await activeScore(page)===501,'181 změnilo skóre na '+await activeScore(page));
  assert(await activeName(page)==='Hráč 1','181 přepnulo hráče');
  await context.close();
});

await test('Hlas vypnutý: po odehraném kole se nativní speak vůbec nevolá', async () => {
  const {context,page}=await makePage();
  await page.getByRole('button',{name:'Hlas',exact:true}).click();
  await page.getByRole('button',{name:/Start hry/}).click();
  await key(page,20); await key(page,20); await key(page,20);
  await page.waitForTimeout(650);
  const calls=await page.evaluate(()=>window.__nativeCalls.speak);
  assert(calls.length===0,'Hlas je vypnutý, ale speak calls='+JSON.stringify(calls));
  await context.close();
});

await test('Zvuk vypnutý: zásah ani výhra nevolají audio.play()', async () => {
  const {context,page}=await makePage();
  await page.evaluate(()=>{
    window.__audioPlayCount=0;
    HTMLMediaElement.prototype.play=function(){window.__audioPlayCount++; return Promise.resolve();};
  });
  await page.getByRole('button',{name:'Zvuk',exact:true}).click();
  await start101(page); await finish101Any(page); await page.waitForTimeout(120);
  const n=await page.evaluate(()=>window.__audioPlayCount);
  assert(n===0,'Zvuk vypnutý, ale audio.play() bylo '+n+'×');
  await context.close();
});

await test('Zvuk zapnutý: zásah používá hit sound a výhra fanfáru', async () => {
  const {context,page}=await makePage();
  await page.evaluate(()=>{
    window.__audioSrcs=[];
    HTMLMediaElement.prototype.play=function(){window.__audioSrcs.push(this.getAttribute('src')||''); return Promise.resolve();};
  });
  await start101(page); await finish101Any(page); await page.waitForTimeout(120);
  const srcs=await page.evaluate(()=>window.__audioSrcs);
  assert(srcs.some(x=>x.includes('dart-hit.mp3')),'Chybí hit sound: '+JSON.stringify(srcs));
  assert(srcs.some(x=>x.includes('tada-fanfare')),'Chybí fanfára: '+JSON.stringify(srcs));
  await context.close();
});

await test('Cricket save/resume zachová marky a body', async () => {
  const {context,page}=await makePage();
  await chooseByLabel(page,'Režim','Cricket');
  await page.getByRole('button',{name:/Start hry/}).click();
  await mult(page,'TRIPLE'); await key(page,20);
  const before=await page.locator('.playerCol').first().innerText();
  await page.getByRole('button',{name:'Zpět',exact:true}).first().click();
  await page.getByRole('button',{name:'Pokračovat ve hře',exact:true}).click();
  await page.waitForTimeout(100);
  const after=await page.locator('.playerCol').first().innerText();
  assert(after.includes('Ⓧ'),'Po resume Cricket chybí zavřená 20: '+after);
  assert(before.includes('Ⓧ'),'Před uložením test neuzavřel 20');
  await context.close();
});

await test('Around save/resume zachová další cíl', async () => {
  const {context,page}=await makePage();
  await chooseByLabel(page,'Režim','Around the Clock');
  await page.getByRole('button',{name:/Start hry/}).click();
  await key(page,1); await key(page,2);
  const before=(await page.locator('.playerCard.active .aroundTargetBox').innerText()).trim();
  await page.getByRole('button',{name:'Zpět',exact:true}).first().click();
  await page.getByRole('button',{name:'Pokračovat ve hře',exact:true}).click();
  const after=(await page.locator('.playerCard.active .aroundTargetBox').innerText()).trim();
  assert(before===after,'Around cíl se změnil '+before+' -> '+after);
  await context.close();
});

await test('Ruleta Undo vrátí poslední zásah a bod', async () => {
  const {context,page}=await makePage();
  await chooseByLabel(page,'Režim','Ruleta');
  await page.getByRole('button',{name:/Start hry/}).click();
  await page.getByRole('button',{name:'Losovat',exact:true}).click();
  await page.waitForTimeout(3300);
  await page.getByRole('button',{name:'Zásah +1',exact:true}).click();
  await page.getByRole('button',{name:'Zpět',exact:true}).last().click();
  const score=(await page.locator('.playerCard.active .rouletteScore').innerText()).trim();
  assert(score.includes('0'),'Roulette Undo nevrátil bod: '+score);
  await context.close();
});

await test('Free hráči: limit je maximálně 3', async () => {
  const {context,page}=await makePage();
  for(let i=0;i<8;i++) await page.getByRole('button',{name:/Přidat hráče/}).click();
  const count=await page.locator('.playerRow').count();
  assert(count<=3,'Free dovolilo '+count+' hráčů');
  await context.close();
});

await test('Premium hráči: limit je maximálně 5', async () => {
  const {context,page}=await makePage({premium:true});
  for(let i=0;i<10;i++) await page.getByRole('button',{name:/Přidat hráče/}).click();
  const count=await page.locator('.playerRow').count();
  assert(count<=5,'Premium dovolilo '+count+' hráčů');
  await context.close();
});

await test('Čínština má vlastní překlad Sdílet aplikaci, ne anglický fallback', async () => {
  const {context,page}=await makePage();
  await chooseLanguage(page,'中文');
  const txt=(await page.locator('body').innerText());
  assert(!txt.includes('Share app'),'Čínština zobrazuje anglické Share app');
  await context.close();
});

await test('Statistiky po dokončené Classic hře obsahují uložený zápas a vítěze', async () => {
  const {context,page}=await makePage();
  await start101(page); await finish101Any(page); await page.waitForTimeout(180);
  const rec=await page.evaluate(()=>JSON.parse(localStorage.getItem('finishedGames')||'[]')[0]);
  assert(rec && rec.winner==='Hráč 1','Uložený winner='+JSON.stringify(rec?.winner));
  assert(rec.detailed===true,'Záznam nemá detailed=true');
  await page.getByRole('button',{name:'Zpět',exact:true}).first().click();
  await page.getByText('Statistiky',{exact:true}).scrollIntoViewIfNeeded();
  const body=await page.locator('body').innerText();
  assert(body.includes('Hráč 1'),'Statistiky neobsahují Hráče 1');
  await context.close();
});

await test('320px mobilní šířka: lobby nemá horizontální overflow v CS/DE/RU/ZH', async () => {
  const {context,page}=await makePage();
  await page.setViewportSize({width:320,height:700});
  for(const lang of ['Čeština','Deutsch','Русский','中文']){
    await chooseLanguage(page,lang);
    const dims=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));
    assert(dims.sw<=dims.cw+1,lang+' overflow '+JSON.stringify(dims));
  }
  await context.close();
});

// Stress: 50 quick Classic 101 games through actual UI in one session.
await test('Stress: 50 po sobě jdoucích Classic 101 her bez pádu/stavu mimo rozsah', async () => {
  const {context,page,errors}=await makePage();
  // disable sound+voice to speed up and avoid media timing
  await page.getByRole('button',{name:'Zvuk',exact:true}).click();
  await page.getByRole('button',{name:'Hlas',exact:true}).click();
  await page.getByRole('button',{name:'101',exact:true}).click();
  for(let i=0;i<50;i++){
    await page.getByRole('button',{name:/Start hry/}).click();
    await finish101Any(page);
    await page.waitForTimeout(35);
    assert(await page.locator('.playerCard.winner').count()===1,'Hra '+(i+1)+': chybí winner');
    await page.getByRole('button',{name:'Zpět',exact:true}).first().click();
    await page.waitForTimeout(25);
  }
  assert(errors.length===0,'Během stressu JS chyby: '+errors.join(' | '));
  await context.close();
});

const counts = {
  pass: results.filter(r=>r.status==='PASS').length,
  fail: results.filter(r=>r.status==='FAIL').length,
  total: results.length
};
const report = { generatedAt: new Date().toISOString(), base: BASE, counts, results, diagnostics };
fs.writeFileSync(REPORT_PREFIX+'-report.json', JSON.stringify(report,null,2));
let md = `# DartScore Pro v95 – automated regression report\n\nTarget: ${BASE}\n\n**PASS ${counts.pass} / FAIL ${counts.fail} / TOTAL ${counts.total}**\n\n`;
for (const r of results) md += `- **${r.status}** — ${r.name}${r.detail ? `: ${r.detail}` : ''}\n`;
if (diagnostics.length) md += '\n## Diagnostics\n'+diagnostics.map(d=>`- ${d.name}: ${JSON.stringify(d.value)}`).join('\n')+'\n';
fs.writeFileSync(REPORT_PREFIX+'-report.md', md);
console.log('QA_SUMMARY', JSON.stringify(counts));
console.log(md);
await browser.close();
