import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium,webKit}=await import('file:///C:/Users/Mirek/Documents/ChatGPT/Darts/.qa-runtime/node_modules/playwright/index.mjs').then(m=>({chromium:m.chromium,webKit:m.webkit}));
const url='http://127.0.0.1:4193/';
const langs=['cs','en','de','es','nl','ru','zh'];
const results=[],dir='build/ui-feedback-evidence';
fs.mkdirSync(dir,{recursive:true});
for(const [engine,type] of Object.entries({chromium,webkit:webKit})){
 const browser=await type.launch();
 try{
  for(const width of [320,393])for(const premium of [false,true])for(const lang of langs){
   let phase='setup';
   const ctx=await browser.newContext({viewport:{width,height:premium?740:667},isMobile:true,hasTouch:true,locale:lang});
   const page=await ctx.newPage();page.setDefaultTimeout(10000);
   try{
    await page.goto(url,{waitUntil:'networkidle'});
    await page.evaluate(({lang,premium})=>{
     localStorage.clear();
     localStorage.setItem('lobbyDefaultsVersion','1.1.62');
     localStorage.setItem('premium',String(premium));
     localStorage.setItem('lobby',JSON.stringify({lang,mode:'classic',playerMode:'teams',scoreInputMode:'round',ai:'off',randomOrder:false,players:Array.from({length:6},(_,i)=>({id:i+1,name:'Player '+(i+1),team:i%2?'B':'A'}))}));
    },{lang,premium});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelectorAll('.playerRow').length===6);
    assert.equal(await page.locator('.playerActions').count(),0);
    assert.equal(await page.locator('.vibrationToggle').count(),1);
    phase='classic-teams-round';
    await page.locator('.lobbyStartActions .green').click();
    await page.locator('.roundTotalKeypad').waitFor();
    const c=await page.evaluate(()=>{
     const cap=document.querySelector('.gameOutCaption'),value=document.querySelector('.gameOutValue'),pad=document.querySelector('.roundTotalKeypad'),stats=[...document.querySelectorAll('.teamPane .playerStats')],nums=[...pad.querySelectorAll('[data-keypad-number]')];
     const r=e=>e.getBoundingClientRect();
     return {nowrap:getComputedStyle(value).whiteSpace==='nowrap',visible:value.scrollWidth<=value.clientWidth+1&&cap.scrollWidth<=cap.clientWidth+1,stacked:r(value).top>=r(cap).bottom-2,count:document.querySelectorAll('.teamPane .playerCard').length,statsSize:Math.min(...stats.map(e=>parseFloat(getComputedStyle(e).fontSize))),statsOverflow:stats.some(e=>e.scrollWidth>e.clientWidth+1),numericCount:nums.length,numericSize:Math.min(...nums.map(e=>parseFloat(getComputedStyle(e).fontSize))),backspace:getComputedStyle(pad.querySelector('.backspace')).backgroundImage,barWidth:r(document.querySelector('.gameTopBar')).right,barHeight:r(document.querySelector('.gameTopBar')).height,globalWidth:document.documentElement.scrollWidth};
    });
    assert.ok(c.nowrap&&c.visible&&c.stacked&&c.count===2&&c.statsSize>=14&&!c.statsOverflow&&c.numericCount===10&&c.numericSize>=30&&c.backspace.includes('gradient')&&c.barWidth<=width+1&&c.barHeight<=80&&c.globalWidth<=width+1,JSON.stringify(c));
    const key=page.locator('.roundTotalKeypad [data-keypad-number]').first();
    await key.dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch'});
    const pressed=await key.evaluate(e=>({className:e.className,color:getComputedStyle(e).backgroundColor}));
    assert.ok(pressed.className.includes('pressed')&&pressed.color==='rgb(255, 255, 255)',JSON.stringify(pressed));
    await key.dispatchEvent('pointerup',{pointerId:1,pointerType:'touch'});
    await page.locator('.vibrationToggle').click();
    assert.equal(await page.locator('.vibrationToggle').getAttribute('aria-pressed'),'true');
    if(lang==='cs'&&width===393&&!premium)await page.screenshot({path:dir+'/'+engine+'-teams-round.png'});
    phase='rouletteDouble';
    await page.locator('.gameBack').click();
    await page.locator('.lobbyWrap').waitFor();
    await page.locator('.lobbyModeGroup .themedSelectTrigger').click();
    await page.locator('.themedSelectMenu [role="option"]').last().click();
    await page.locator('.lobbyStartActions .green').click();
    await page.locator('.roulettePane .playerStats').first().waitFor();
    const q=await page.evaluate(()=>{
     const stats=document.querySelector('.roulettePane .playerStats'),spans=[...stats.children],r=e=>e.getBoundingClientRect();
     return {score:document.querySelector('.roulettePane .rouletteScore')?.textContent,font:parseFloat(getComputedStyle(stats).fontSize),column:getComputedStyle(stats).flexDirection==='column',stacked:r(spans[2]).top>=r(spans[0]).bottom-2,overflow:stats.scrollWidth>stats.clientWidth+1,width:document.documentElement.scrollWidth,barWidth:r(document.querySelector('.gameTopBar')).right};
    });
    assert.ok(q.score.endsWith(': 0')&&q.font>=14&&q.column&&q.stacked&&!q.overflow&&q.width<=width+1&&q.barWidth<=width+1,JSON.stringify(q));
    if(lang==='cs'&&width===393&&!premium)await page.screenshot({path:dir+'/'+engine+'-rouletteDouble.png'});
    results.push({engine,width,premium,lang,status:'pass'});
    console.log('PASS',engine,width,premium,lang);
   }catch(e){
    results.push({engine,width,premium,lang,status:'fail',phase,error:String(e)});
    console.log('FAIL',engine,width,premium,lang,phase,String(e));
    try{await page.screenshot({path:dir+'/FAIL-'+engine+'-'+width+'-'+premium+'-'+lang+'-'+phase+'.png'});}catch{}
   }finally{await ctx.close();fs.writeFileSync(dir+'/results.json',JSON.stringify(results,null,2));}
  }
 }finally{await browser.close();}
}
const failed=results.filter(x=>x.status==='fail');
console.log('RESULT',results.length,'FAIL',failed.length);
assert.deepEqual(failed,[]);
