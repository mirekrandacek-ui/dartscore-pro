import assert from 'node:assert/strict';
import fs from 'node:fs';
const {chromium,webkit}=await import(process.env.DARTSCORE_PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.DARTSCORE_UI_URL || 'http://127.0.0.1:4193/';
const output=process.env.DARTSCORE_MATRIX_OUTPUT||'build/redesign-evidence';fs.mkdirSync(output,{recursive:true});
const results=[];
const engines=(process.env.UI_ENGINES || 'chromium,webkit').split(',');
const modes=(process.env.UI_MODES || 'classic,cricket,around,roulette,rouletteDouble').split(',');
const langs=(process.env.UI_LANGS || 'cs,en,de,es,nl,ru,zh').split(',');
for(const engine of engines){
 const browser=await ({chromium,webkit}[engine]).launch({timeout:20000});
 try{
 for(const width of (process.env.UI_WIDTHS || '320,360,393,430').split(',').map(Number)) for(const premium of [false,true]) for(const lang of langs){
  console.log('CHECK',engine,width,premium,lang);
  const context=await browser.newContext({viewport:{width,height:premium?740:667},isMobile:true,hasTouch:true,locale:lang,
    userAgent:engine==='webkit'?'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1':'Mozilla/5.0 (Linux; Android 12; SM-G973F) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36'});
  await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  const page=await context.newPage();page.setDefaultTimeout(10000);
  let mode='classic';
  try{
   for(mode of modes){
    const fixture={lang,mode,premium,scoreInputMode:process.env.UI_SCORE_INPUT||'darts'};
    await page.goto(base,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>document.querySelectorAll('.playerRow').length>0);
    await page.evaluate(({lang,mode,premium,scoreInputMode})=>{
      localStorage.clear();localStorage.setItem('lobbyDefaultsVersion','1.1.62');localStorage.setItem('premium',String(premium));
      localStorage.setItem('lobby',JSON.stringify({lang,mode,scoreInputMode,ai:'off',randomOrder:false,players:Array.from({length:6},(_,i)=>({id:i+1,name:i===0?'Alexandra van der Meer':`Player ${i+1}`}))}));
    },fixture);
    const errors=[];const onError=e=>errors.push(String(e));page.on('pageerror',onError);
    await page.goto(base,{waitUntil:'domcontentloaded'});
    // Native ad space is represented by the reduced viewport, safe-area by CSS variables.
    await page.addStyleTag({content:':root{--sat:20px;--sab:24px;}'});
    await page.locator('.lobbyWrap').waitFor();
    await page.waitForFunction(mode=>document.querySelectorAll('.playerRow').length===6 && document.querySelector('.container').dataset.mode===mode,mode);
    const lobby=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,
     players:document.querySelectorAll('.playerRow').length,toolbar:document.querySelector('.utilityHeader').getBoundingClientRect().bottom}));
    assert.equal(lobby.players,6);assert.ok(lobby.scroll<=width+1,JSON.stringify(lobby));
    assert.equal(await page.locator('.utilityHeader .iconBtn').count(),3);
    if(width===393&&lang==='cs'&&!premium)await page.screenshot({path:`${output}/${engine}-home-${mode}.png`});
    await page.locator('.lobbyStartActions .green').click();
    await page.locator(`.container[data-screen="game"][data-mode="${mode}"]`).waitFor();
    assert.equal(await page.locator('.languagePicker').count(),0,'Language belongs in lobby only');
    assert.equal(await page.locator('.gameTopBar button[aria-pressed]').count(),3);
    assert.equal(await page.locator('.gameSave').count(),premium?1:0);
    assert.ok(await page.locator('.gameTopBar').evaluate(e=>e.getBoundingClientRect().height<=80),'One compact game toolbar');
    const geometry=await page.evaluate(()=>{
      const issues=[]; const rect=e=>e.getBoundingClientRect();const root=document.querySelector('.container');
      for(const selector of ['.utilityHeader','.gameTopBar','.padPane','.playersPane','.cricketWrap']) for(const e of document.querySelectorAll(selector)){
       const r=rect(e);if(r.left<0||r.right>innerWidth+1||r.bottom>innerHeight+1||r.height<1)issues.push({selector,kind:'viewport',left:r.left,right:r.right,bottom:r.bottom,height:r.height});
      }
      const pad=document.querySelector('.padPane');
      const total=document.querySelector('.roundTotalDisplay');
      if(total){
       if(rect(total).width<rect(pad).width-20)issues.push({kind:'round-display-width'});
       for(const row of pad.querySelectorAll('.padRow')){
        const keys=[...row.children].map(rect);
        if(keys.length!==3||keys.some(k=>Math.abs(k.top-keys[0].top)>1)||keys[2].left<=keys[1].left)issues.push({kind:'round-three-column-row'});
       }
      }
      if(pad) for(const e of pad.querySelectorAll('button')){
        const r=rect(e),p=rect(pad);if(r.left<p.left-1||r.right>p.right+1||r.bottom>p.bottom+1)issues.push({text:e.textContent,kind:'pad-bounds'});
        if(e.matches('.key')) {
          const range=document.createRange();range.selectNodeContents(e);const ink=range.getBoundingClientRect();
          if(ink.left<r.left+1||ink.right>r.right-1)issues.push({text:e.textContent,kind:'clipped-key-label'});
        }
        if(e.scrollWidth>e.clientWidth+1)issues.push({text:e.textContent,kind:'text-overflow'});
      }
      for(const card of document.querySelectorAll('.playerCard')) for(const e of card.querySelectorAll('.lastTotal,.dartBox,.rouletteControls button,.playerScore,.checkoutHint')){
       const r=rect(e),c=rect(card);if(r.left<c.left-1||r.right>c.right+1||e.scrollWidth>e.clientWidth+1)issues.push({text:e.textContent,kind:'card-overflow'});
      }
      const name=document.querySelector('.playerNameText');
      const stats=document.querySelector('.playerStats');
      const fontSizes={name:name?parseFloat(getComputedStyle(name).fontSize):null,stats:stats?parseFloat(getComputedStyle(stats).fontSize):null};
      if(name&&fontSizes.name<19)issues.push({kind:'small-name',...fontSizes});
      if(stats&&fontSizes.stats<14)issues.push({kind:'small-stats',...fontSizes});
      const pane=document.querySelector('.playersPane,.cricketScroll');
      return {issues,fontSizes,scrollWidth:document.documentElement.scrollWidth,players:document.querySelectorAll('.playerCard,.playerCol').length,pane:{height:pane.clientHeight,scrollHeight:pane.scrollHeight,scrollWidth:pane.scrollWidth}};
    });
    assert.equal(geometry.players,6); assert.ok(geometry.scrollWidth<=width+1);assert.deepEqual(geometry.issues,[]);assert.deepEqual(errors,[]);
    if(mode==='cricket'){
      const marks=page.locator('.playerCol').first().locator('.markCell').first();
      await page.locator('.padPane .key').filter({hasText:/^15$/}).click(); assert.equal(await marks.textContent(),'/');
      await page.locator('.padPane .key').filter({hasText:/^15$/}).click(); assert.equal(await marks.textContent(),'✕');
      await page.locator('.padPane .key').filter({hasText:/^15$/}).click();assert.equal(await marks.locator('svg circle').count(),1);
      assert.equal(await marks.locator('svg').evaluate(e=>getComputedStyle(e).color),'rgb(34, 197, 94)');
    }
    if(width===393&&lang==='cs'&&!premium)await page.screenshot({path:`${output}/${engine}-${mode}.png`});
    results.push({engine,width,premium,lang,mode,...geometry,status:'pass'});
    page.off('pageerror',onError);
   }
  }catch(e){await page.screenshot({path:`${output}/failed-${engine}-${width}-${premium}-${lang}-${mode}.png`});results.push({engine,width,premium,lang,mode,status:'fail',error:String(e)});console.log('FAIL',engine,width,premium,lang,mode,String(e));}
  finally{await context.close();fs.writeFileSync(`${output}/results-${engine}.json`,JSON.stringify(results,null,2));}
 }
 }finally{await browser.close();}
 console.log(engine,results.filter(x=>x.status==='pass').length,'passed',results.filter(x=>x.status==='fail').length,'failed');
}
assert.ok(results.every(x=>x.status==='pass'),'See build/redesign-evidence/results-*.json');
