import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'file:///C:/Users/Mirek/Documents/ChatGPT/Darts/.qa-runtime/node_modules/playwright/index.mjs';

const browser=await chromium.launch();
const ctx=await browser.newContext({viewport:{width:393,height:780},isMobile:true,hasTouch:true});
await ctx.addInitScript(()=>{
  window.__hapticCalls=0;
  window.DartScoreAndroid={
    hapticTap(){window.__hapticCalls+=1;},
    setPremium(){},
    isPrivacyOptionsRequired(){return false;},
  };
});
const page=await ctx.newPage(),results=[];
try{
  await page.goto('http://127.0.0.1:4193/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('.playerRow').length>0);
  await page.evaluate(()=>{
    localStorage.clear();
    localStorage.setItem('dspHapticsEnabled','false');
    localStorage.setItem('lobbyDefaultsVersion','1.1.62');
    localStorage.setItem('lobby',JSON.stringify({
      lang:'cs',mode:'classic',players:[
        {id:'haptic-1',name:'Test 1'},
        {id:'haptic-2',name:'Test 2'},
        {id:'haptic-3',name:'Test 3'},
      ]
    }));
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('.playerDragHandle').length===3);
  async function holdAndMove(){
    const handles=page.locator('.playerDragHandle');
    await handles.first().scrollIntoViewIfNeeded();
    const a=await handles.first().boundingBox(),second=await handles.nth(1).boundingBox();
    assert.ok(a&&second);
    const x=a.x+a.width/2,y=a.y+a.height/2;
    await page.mouse.move(x,y);
    await page.mouse.down();
    await page.waitForTimeout(475);
    assert.equal(await page.locator('.playerRow.dragging').count(),1,'Long press activates drag');
    await page.mouse.move(x,second.y+second.height/2,{steps:5});
    await page.mouse.up();
    await page.waitForTimeout(80);
    return page.evaluate(()=>window.__hapticCalls);
  }
  const toggle=page.locator('.vibrationToggle');
  assert.equal(await toggle.getAttribute('aria-pressed'),'false');
  assert.equal(await holdAndMove(),0,'OFF: drag does not request a vibration');
  results.push({state:'off',hapticCalls:0});
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-pressed'),'true');
  assert.equal(await holdAndMove(),1,'ON: drag requests one vibration');
  results.push({state:'on',hapticCalls:1});
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-pressed'),'false');
  assert.equal(await holdAndMove(),1,'OFF again: previous vibration request count stays unchanged');
  results.push({state:'off-again',hapticCalls:1});
  const stored=await page.evaluate(()=>localStorage.getItem('dspHapticsEnabled'));
  assert.equal(stored,'false');
  console.log('SUCCESS: 3 long-press drag tests across OFF, ON, OFF; haptic requests 0, 1, 1');
  console.log(JSON.stringify(results));
}finally{
  fs.writeFileSync('build/ui-physical-qa-20261105/drag-haptics-toggle-results.json',JSON.stringify(results,null,2));
  await browser.close();
}
