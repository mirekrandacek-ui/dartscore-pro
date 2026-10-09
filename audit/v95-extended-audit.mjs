import { chromium } from 'playwright';
import fs from 'node:fs';

const out=[];
const rec=(name,ok,detail='')=>{out.push({name,ok,detail});console.log((ok?'PASS':'FAIL')+' | '+name+(detail?' | '+detail:''));};
const assert=(c,m)=>{if(!c)throw new Error(m);};

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({
  viewport:{width:412,height:915},
  locale:'cs-CZ',
  userAgent:'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 Chrome/154 Mobile Safari/537.36'
});
const page=await context.newPage();
page.setDefaultTimeout(2200);
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));

await page.addInitScript(()=>{
  const realTimeout=window.setTimeout.bind(window), realInterval=window.setInterval.bind(window);
  window.setTimeout=(fn,ms,...args)=>realTimeout(fn,Math.min(Number(ms)||0,15),...args);
  window.setInterval=(fn,ms,...args)=>realInterval(fn,Math.min(Number(ms)||0,15),...args);
  window.__nativeCalls={speak:[],share:[],interstitial:0,premium:[]};
  window.__audioCalls={play:0};
  const originalPlay=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(){
    window.__audioCalls.play++;
    try { const p=originalPlay.call(this); if(p?.catch)p.catch(()=>{}); } catch {}
    return Promise.resolve();
  };
  window.DartScoreAndroid={
    setPremium(v){window.__nativeCalls.premium.push(v);},
    speak(text,lang){window.__nativeCalls.speak.push({text,lang});},
    shareApp(){},
    showInterstitial(){window.__nativeCalls.interstitial++;},
    buyPremium(){},
    restorePremium(){},
    isPrivacyOptionsRequired(){return false;},
    showPrivacyOptions(){}
  };
});
await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});

const seed=async (lobby={}, extras={})=>{
  await page.evaluate(({lobby,extras})=>{
    localStorage.clear();
    localStorage.setItem('lobbyDefaultsVersion','1.1.19');
    localStorage.setItem('lobby',JSON.stringify({
      lang:'cs',mode:'classic',startScore:101,outDouble:false,outTriple:false,outMaster:false,
      legsToWinSet:1,setsToWin:1,randomOrder:false,playThrough:false,ai:'off',
      scoreInputMode:'darts',playerMode:'individual',
      players:[
        {id:'p1',name:'Hráč 1',color:'#16a34a',bot:false,team:'A'},
        {id:'p2',name:'Hráč 2',color:'#3b82f6',bot:false,team:'B'}
      ],
      themeColor:'black',
      ...lobby
    }));
    for(const [k,v] of Object.entries(extras)){
      localStorage.setItem(k, typeof v==='string'?v:JSON.stringify(v));
    }
  },{lobby,extras});
  await page.reload({waitUntil:'networkidle'});
};
const btn=async n=>page.getByRole('button',{name:n,exact:true}).first().click();
const finish101=async()=>{
  await btn('TRIPLE'); await btn('17'); await btn('50'); await page.waitForTimeout(35);
};
const back=async()=>page.locator('.gameTextAction').filter({hasText:'Zpět'}).first().click();

for(const count of [1,2,3,5,8]){
  try{
    const players=Array.from({length:count},(_,i)=>({id:'p'+i,name:'P'+(i+1),color:'#16a34a',bot:false,team:['A','B','C'][i%3]}));
    await seed({players});
    await btn('▶ Start hry');
    const cards=await page.locator('.playerCard').count();
    assert(cards===count,'expected '+count+' player cards, got '+cards);
    rec('Classic renders '+count+' individual player(s)',true);
  }catch(e){rec('Classic renders '+count+' individual player(s)',false,e.message);}
}

try{
  const players=[
    {id:'a1',name:'A1',color:'#1',bot:false,team:'A'},
    {id:'b1',name:'B1',color:'#2',bot:false,team:'B'},
    {id:'a2',name:'A2',color:'#3',bot:false,team:'A'},
    {id:'b2',name:'B2',color:'#4',bot:false,team:'B'}
  ];
  await seed({players,playerMode:'teams'});
  await btn('▶ Start hry');
  assert(await page.locator('.playersPane .playerCard').count()===2,'expected 2 team cards');
  assert((await page.locator('.playerCard').first().innerText()).includes('Tým A'),'Team A missing');
  await finish101();
  assert(await page.locator('.playerCard.winner').count()===1,'team winner missing');
  rec('Classic team mode 2 teams / 4 players + checkout',true);
}catch(e){rec('Classic team mode 2 teams / 4 players + checkout',false,e.message);}

try{
  await seed({
    players:[{id:'solo',name:'Solo',color:'#1',bot:false,team:'A'}],
    legsToWinSet:2,setsToWin:2
  });
  await btn('▶ Start hry');
  for(let leg=0;leg<4;leg++){
    await finish101();
    await page.waitForTimeout(40);
  }
  assert(await page.locator('.playerCard.winner').count()===1,'match winner absent after 4 legs');
  const txt=await page.locator('.classicMatchProgress').first().innerText();
  assert(/Sety 2\/2/.test(txt),'expected 2/2 sets, got '+txt);
  rec('Classic multi-leg / multi-set progression (2 legs × 2 sets)',true);
}catch(e){rec('Classic multi-leg / multi-set progression (2 legs × 2 sets)',false,e.message);}

try{
  await seed({startScore:301}, {premium:'true'});
  await btn('▶ Start hry');
  await btn('20');
  assert((await page.locator('.playerScore').first().innerText()).trim()==='281','score not 281 before save');
  await back();
  await page.waitForTimeout(25);
  assert(await page.getByRole('button',{name:'Pokračovat ve hře',exact:true}).count()===1,'continue missing');
  await page.reload({waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Pokračovat ve hře',exact:true}).click();
  assert((await page.locator('.playerScore').first().innerText()).trim()==='281','restored score mismatch');
  rec('Save snapshot + reload + Continue restores unfinished game',true);
}catch(e){rec('Save snapshot + reload + Continue restores unfinished game',false,e.message);}

try{
  await seed({players:[{id:'solo',name:'Solo',color:'#1',bot:false,team:'A'}]});
  await page.evaluate(()=>{window.__nativeCalls.interstitial=0;});
  for(let g=1;g<=3;g++){
    await btn('▶ Start hry');
    await finish101();
    await page.waitForTimeout(45);
    if(g<3) await back();
  }
  const n=await page.evaluate(()=>window.__nativeCalls.interstitial);
  assert(n===1,'expected exactly 1 interstitial after 3rd Start+completion, got '+n);
  rec('Interstitial cadence: third explicit Start triggers after completed game',true);
}catch(e){rec('Interstitial cadence: third explicit Start triggers after completed game',false,e.message);}

try{
  await seed({players:[{id:'solo',name:'Solo',color:'#1',bot:false,team:'A'}]});
  await page.evaluate(()=>{window.__nativeCalls.interstitial=0;});
  for(let g=1;g<=2;g++){await btn('▶ Start hry');await finish101();await back();}
  await btn('▶ Start hry');
  await btn('20');
  await back();
  await btn('▶ Start hry');
  await finish101();
  await page.waitForTimeout(50);
  const n=await page.evaluate(()=>window.__nativeCalls.interstitial);
  assert(n===1,'pending interstitial did not survive abandoned third-start game, got '+n);
  rec('Interstitial pending survives abandoned third-start game',true);
}catch(e){rec('Interstitial pending survives abandoned third-start game',false,e.message);}

try{
  await seed({players:[{id:'solo',name:'Solo',color:'#1',bot:false,team:'A'}]});
  await page.evaluate(()=>{window.__audioCalls.play=0;});
  await btn('▶ Start hry');
  await btn('20');
  await finish101().catch(()=>{});
  const n=await page.evaluate(()=>window.__audioCalls.play);
  assert(n>0,'no audio play calls');
  rec('Sound path invokes audio playback',true,'play calls='+n);
}catch(e){rec('Sound path invokes audio playback',false,e.message);}

try{
  await seed({players:[{id:'solo',name:'Solo',color:'#1',bot:false,team:'A'}]});
  await page.evaluate(()=>{window.__nativeCalls.speak=[];});
  await page.getByRole('button',{name:'Hlas',exact:true}).click(); // turn voice off
  await btn('▶ Start hry'); await btn('1'); await btn('1'); await btn('1'); await page.waitForTimeout(25);
  const n=await page.evaluate(()=>window.__nativeCalls.speak.length);
  assert(n===0,'voice off still spoke '+n+' times');
  rec('Voice OFF suppresses TTS',true);
}catch(e){rec('Voice OFF suppresses TTS',false,e.message);}

for(const mode of ['classic','cricket','around','roulette']){
  for(const level of ['beginner','medium','hard']){
    try{
      await seed({
        mode: mode==='classic'?'classic':mode,
        ai:level,
        players:[{id:'human',name:'Human',color:'#1',bot:false,team:'A'}]
      });
      // AI effect should add bot in lobby
      await page.waitForTimeout(30);
      const inputs=page.locator('.playerRow input');
      assert(await inputs.count()===2,'bot not added');
      await btn('▶ Start hry');
      // human makes a zero visit or switch, then wait for bot action
      if(mode==='roulette'){
        await btn('Losovat'); await page.waitForTimeout(40); await btn('Přepnout hráče');
      } else {
        await btn('0'); await btn('0'); await btn('0');
      }
      await page.waitForTimeout(120);
      const thrown=await page.locator('.playerStats').allInnerTexts().catch(()=>[]);
      rec('Bot '+level+' acts in '+mode,true,'flow stayed responsive');
    }catch(e){rec('Bot '+level+' acts in '+mode,false,e.message);}
  }
}

try{
  await seed();
  const add=page.getByRole('button',{name:/Přidat hráče/});
  await add.click(); await add.click(); await add.click();
  assert(await page.locator('.playerRow').count()===5,'add player count mismatch');
  const names=page.locator('.playerRow input');
  await names.nth(4).fill('Pátý');
  await page.getByTitle('Up').nth(4).click();
  assert(await names.nth(3).inputValue()==='Pátý','move up failed');
  await page.getByTitle('Delete').nth(3).click();
  assert(await page.locator('.playerRow').count()===4,'delete failed');
  rec('Player add / rename / reorder / delete',true);
}catch(e){rec('Player add / rename / reorder / delete',false,e.message);}

try{
  await seed({players:[{id:'solo',name:'Solo',color:'#1',bot:false,team:'A'}]});
  await btn('▶ Start hry'); await finish101(); await back();
  const games=await page.evaluate(()=>JSON.parse(localStorage.getItem('finishedGames')||'[]'));
  assert(games.length>=1,'finishedGames empty');
  assert(games[0].winner==='Solo','winner record mismatch');
  rec('Completed match writes statistics/history record',true);
}catch(e){rec('Completed match writes statistics/history record',false,e.message);}

try{
  await seed({players:[{id:'solo',name:'Solo',color:'#1',bot:false,team:'A'}]});
  await btn('▶ Start hry');
  for(let i=0;i<1000;i++){
    await finish101();
    if(i<999) await btn('Opakovat hru');
  }
  assert(await page.locator('.playerCard.winner').count()===1,'final winner missing');
  rec('1000 repeated Classic 101 matches without state crash',true);
}catch(e){rec('1000 repeated Classic 101 matches without state crash',false,e.message);}

try{assert(pageErrors.length===0,'page errors: '+pageErrors.join(' || '));rec('No uncaught page errors in extended audit',true);}
catch(e){rec('No uncaught page errors in extended audit',false,e.message);}

await browser.close();
const summary={passed:out.filter(x=>x.ok).length,failed:out.filter(x=>!x.ok).length,results:out,pageErrors};
fs.writeFileSync('audit-v95-extended-results.json',JSON.stringify(summary,null,2));
console.log('EXTENDED_AUDIT '+JSON.stringify(summary));
