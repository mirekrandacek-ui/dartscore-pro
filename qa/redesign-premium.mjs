import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium,webkit}=await import(process.env.DARTSCORE_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.DARTSCORE_UI_URL||'http://127.0.0.1:4193/';
const out='build/premium-evidence';fs.mkdirSync(out,{recursive:true});const results=[];
for(const [engine,type] of Object.entries({chromium,webkit})){
 const b=await type.launch();try{
 for(const themeColor of ['black','green','blue','red','purple'])for(const mode of ['classic','cricket','around','roulette','rouletteDouble']){
  const c=await b.newContext({viewport:{width:360,height:740},isMobile:true,hasTouch:true});
  await c.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  const p=await c.newPage();try{
   await p.goto(base,{waitUntil:'networkidle'});await p.evaluate(({mode,themeColor})=>{localStorage.clear();localStorage.setItem('premium','true');localStorage.setItem('lobbyDefaultsVersion','1.1.62');localStorage.setItem('lobby',JSON.stringify({lang:'cs',mode,themeColor,ai:'off',players:Array.from({length:6},(_,i)=>({id:i+1,name:`Premium ${i+1}`}))}));},{mode,themeColor});
   await p.reload({waitUntil:'networkidle'});await p.waitForFunction(mode=>document.querySelector('.container')?.dataset.mode===mode&&document.querySelectorAll('.playerRow').length===6,mode);await p.locator('.premiumSwatches button').last().waitFor();
   assert.equal(await p.locator('.premiumSwatches button').count(),5);
   assert.ok(await p.locator('.premiumSwatches button').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().width>=40&&e.getBoundingClientRect().height>=40)));
   await p.locator('.premiumActions button').first().click();
   if(mode==='classic')await p.screenshot({path:`${out}/${engine}-lobby-${themeColor}.png`,fullPage:true});
   await p.locator('.lobbyStartActions .green').click();await p.locator('.gameSave').waitFor();
   assert.equal(await p.locator('.languagePicker').count(),0);
   const geometry=await p.locator('.gameTopBar').evaluate(e=>{const r=e.getBoundingClientRect();return {height:r.height,right:r.right,width:innerWidth,overflow:[...e.querySelectorAll('button,span')].some(e=>e.scrollWidth>e.clientWidth+1)};});
   assert.ok(geometry.height<=80&&!geometry.overflow&&geometry.right<=geometry.width);
   await p.locator('.gameSave').click();assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('savedGame')).mode),mode);
   await p.locator('.gameRestart').click();await p.locator('.gameBack').click();await p.locator('.lobbyWrap').waitFor();
   await p.locator('.lobbyStartActions button').last().click();await p.locator('.gameSave').waitFor();
   await p.screenshot({path:`${out}/${engine}-${mode}-${themeColor}.png`});
   results.push({engine,mode,themeColor,status:'pass',geometry});
  }finally{await c.close();fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));}
 }
 }finally{await b.close();}
}
console.log(results.length,'Premium theme/game/save/restart/continue cases passed');
