import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium,webkit}=await import(process.env.DARTSCORE_PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.DARTSCORE_UI_URL || 'http://127.0.0.1:4193/';
const results=[]; fs.mkdirSync('build/redesign-flows',{recursive:true});
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch();
 try{
 const ctx=await browser.newContext({viewport:{width:393,height:740},isMobile:true,hasTouch:true,locale:'en-US'});
 await ctx.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 const page=await ctx.newPage();page.setDefaultTimeout(15000);
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const seed=async extra=>{
  await page.goto(base,{waitUntil:'networkidle'});
  await page.evaluate(extra=>{localStorage.clear();localStorage.setItem('lobbyDefaultsVersion','1.1.62');localStorage.setItem('premium','true');
   localStorage.setItem('lobby',JSON.stringify({lang:'en',mode:'classic',outDouble:false,ai:'off',randomOrder:false,players:Array.from({length:6},(_,i)=>({id:i+1,name:`Guest ${i+1}`,team:i%2?'B':'A'})),...extra}));},extra);
  await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>document.querySelectorAll('.playerRow').length===6);
 };
 for(const mode of ['classic','cricket','around']){
  await seed({mode});await page.locator('.lobbyStartActions .green').click();
  const activeSelector=mode==='cricket'?'.playerCol.active':'.playerCard.active';
  for(let p=1;p<=5;p++){
    for(let d=0;d<3;d++) {await page.locator('.padPane .key').filter({hasText:/^0$/}).click();await page.waitForTimeout(110);}
    await page.waitForFunction(({s,n})=>document.querySelector(s)?.textContent.includes(`Guest ${n}`),{s:activeSelector,n:p+1});
  }
  await page.waitForTimeout(400);
  const visible=await page.locator(activeSelector).evaluate(e=>{const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left,right:r.right,pTop:p.top,pBottom:p.bottom,pLeft:p.left,pRight:p.right};});
  assert.ok(visible.top>=visible.pTop-2&&visible.bottom<=visible.pBottom+2&&visible.left>=visible.pLeft-2&&visible.right<=visible.pRight+2,JSON.stringify(visible));
  const sound=page.locator('.gameTopBar button[aria-pressed]').first();await sound.click();assert.equal(await sound.getAttribute('aria-pressed'),'false');
  const voice=page.locator('.gameTopBar button').filter({has:page.locator('.iconHead')});assert.equal(await voice.count(),mode==='classic'?1:0);if(mode==='classic'){await voice.click();assert.equal(await voice.getAttribute('aria-pressed'),'false');}
  const haptic=page.locator('.gameTopBar .vibrationToggle');assert.equal(await haptic.getAttribute('aria-pressed'),'false');await haptic.click();assert.equal(await haptic.getAttribute('aria-pressed'),'true');
  await page.screenshot({path:`build/redesign-flows/${engine}-${mode}-sixth-player.png`});
  await page.locator('.gameBack').first().click();await page.locator('.lobbyWrap').waitFor();
  assert.equal(await page.locator('.lobbyStartActions button').count(),2);
  const aligned=await page.locator('.lobbyStartActions').evaluate(e=>{const[a,b]=e.children;return Math.abs(a.getBoundingClientRect().top-b.getBoundingClientRect().top)<2;});assert.ok(aligned);
  await page.locator('.lobbyStartActions button').last().click();await page.locator(activeSelector).waitFor();
  assert.ok((await page.locator(activeSelector).textContent()).includes('Guest 6'));
  results.push({engine,flow:`${mode}: six players, auto visibility, audio controls, return and continue`,status:'pass'});
 }
 await seed({mode:'classic',scoreInputMode:'round'});await page.locator('.lobbyStartActions .green').click();
 await page.locator('.roundTotalKeypad button').filter({hasText:/^6$/}).click();await page.locator('.roundTotalKeypad button').filter({hasText:/^0$/}).click();
 await page.locator('.roundTotalKeypad button').filter({hasText:/^OK$/}).click();
 assert.equal(await page.locator('.playerScore').first().textContent(),'441');results.push({engine,flow:'round total keypad enters 60 without scoring changes',status:'pass'});
 await seed({playerMode:'teams'});assert.equal(await page.locator('.playerTeam').count(),6);
 await page.locator('.playerName input').first().fill('Updated Guest');
 const firstRow=page.locator('.playerDragHandle').first();const secondRow=page.locator('.playerDragHandle').nth(1);
 await firstRow.scrollIntoViewIfNeeded();const start=await firstRow.boundingBox();const dest=await secondRow.boundingBox();
 await page.mouse.move(start.x + start.width/2,start.y + start.height/2);await page.mouse.down();
 await page.waitForTimeout(460);await page.mouse.move(dest.x + dest.width/2,dest.y + dest.height/2,{steps:6});await page.mouse.up();
 assert.equal(await page.locator('.playerName input').nth(1).inputValue(),'Updated Guest');
 await page.locator('.lobbyStartActions .green').click();assert.equal(await page.locator('.playerCard').count(),2);
 results.push({engine,flow:'team assignment, editable names and reordering retained',status:'pass'});
 assert.deepEqual(errors,[]);await ctx.close();
 }finally{await browser.close();fs.writeFileSync('build/redesign-flows/results.json',JSON.stringify(results,null,2));}
}
console.log(results);
