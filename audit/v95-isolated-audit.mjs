import { chromium } from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true});
const results=[];
const rec=(n,o,d='')=>{results.push({name:n,ok:o,detail:d});console.log((o?'PASS':'FAIL')+' | '+n+(d?' | '+d:''));};
const assert=(c,m)=>{if(!c)throw new Error(m);};

async function makePage(){
  const context=await browser.newContext({viewport:{width:412,height:915},locale:'cs-CZ',userAgent:'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 Chrome/154 Mobile Safari/537.36'});
  const page=await context.newPage(); page.setDefaultTimeout(2500);
  await page.addInitScript(()=>{
    const rt=window.setTimeout.bind(window),ri=window.setInterval.bind(window);
    window.setTimeout=(fn,ms,...a)=>rt(fn,Math.min(Number(ms)||0,15),...a);
    window.setInterval=(fn,ms,...a)=>ri(fn,Math.min(Number(ms)||0,15),...a);
    window.__calls={interstitial:0};
    window.DartScoreAndroid={setPremium(){},speak(){},shareApp(){},showInterstitial(){window.__calls.interstitial++;},buyPremium(){},restorePremium(){},isPrivacyOptionsRequired(){return false;},showPrivacyOptions(){}};
  });
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  return {page,context};
}
async function seed(page,lobby={},extras={}){
 await page.evaluate(({lobby,extras})=>{
  localStorage.clear(); localStorage.setItem('lobbyDefaultsVersion','1.1.19');
  localStorage.setItem('lobby',JSON.stringify({lang:'cs',mode:'classic',startScore:101,outDouble:false,outTriple:false,outMaster:false,legsToWinSet:1,setsToWin:1,randomOrder:false,playThrough:false,ai:'off',scoreInputMode:'darts',playerMode:'individual',players:[{id:'p1',name:'P1',color:'#1',bot:false,team:'A'}],themeColor:'black',...lobby}));
  for(const [k,v] of Object.entries(extras)) localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));
 },{lobby,extras});
 await page.reload({waitUntil:'domcontentloaded'}); await page.waitForTimeout(50);
}
async function btn(page,n){await page.getByRole('button',{name:n,exact:true}).first().click();}
async function finish(page){await btn(page,'TRIPLE');await btn(page,'17');await btn(page,'50');await page.waitForTimeout(45);}
async function back(page){await page.locator('.gameTextAction').filter({hasText:'Zpět'}).first().click();await page.waitForTimeout(25);}

for(const count of [5,8]){
 const {page,context}=await makePage();
 try{
  const players=Array.from({length:count},(_,i)=>({id:'p'+i,name:'P'+(i+1),color:'#1',bot:false,team:['A','B','C'][i%3]}));
  await seed(page,{players}); await btn(page,'▶ Start hry');
  assert(await page.locator('.playerCard').count()===count,'cards mismatch');
  rec('Isolated Classic '+count+' players',true);
 }catch(e){rec('Isolated Classic '+count+' players',false,e.message);}
 await context.close();
}

{
 const {page,context}=await makePage();
 try{
  await seed(page,{startScore:301},{premium:'true'});
  await btn(page,'▶ Start hry'); await btn(page,'20');
  await back(page);
  assert(await page.getByRole('button',{name:'Pokračovat ve hře',exact:true}).count()===1,'continue button missing');
  await page.reload({waitUntil:'domcontentloaded'}); await page.waitForTimeout(50);
  await btn(page,'Pokračovat ve hře');
  assert((await page.locator('.playerScore').first().innerText()).trim()==='281','expected restored 281');
  rec('Isolated save/reload/continue',true);
 }catch(e){rec('Isolated save/reload/continue',false,e.message);}
 await context.close();
}

{
 const {page,context}=await makePage();
 try{
  await seed(page);
  await page.evaluate(()=>window.__calls.interstitial=0);
  for(let g=1;g<=3;g++){await btn(page,'▶ Start hry');await finish(page);if(g<3)await back(page);}
  await page.waitForTimeout(80);
  const n=await page.evaluate(()=>window.__calls.interstitial);
  assert(n===1,'expected 1, got '+n);
  rec('Isolated 3-start interstitial cadence',true);
 }catch(e){rec('Isolated 3-start interstitial cadence',false,e.message);}
 await context.close();
}
await browser.close();
fs.writeFileSync('audit-v95-isolated-results.json',JSON.stringify({passed:results.filter(x=>x.ok).length,failed:results.filter(x=>!x.ok).length,results},null,2));
