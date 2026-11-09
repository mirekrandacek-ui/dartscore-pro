import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {chromium} from 'file:///C:/Users/Mirek/Documents/ChatGPT/Darts/.qa-runtime/node_modules/playwright/index.mjs';

const root='build/ui-physical-qa-20261105/s23';
fs.mkdirSync(root,{recursive:true});
const adb=(...args)=>execFileSync('C:/Users/Mirek/AppData/Local/Android/Sdk/platform-tools/adb.exe',
  ['-s','RFCW805VSVD',...args],{encoding:'utf8',timeout:35000});
const matches =()=>adb('shell','dumpsys','vibrator_manager').split(/\r?\n/)
 .filter(line=>line.includes('com.randis2288.dartscorepro.uireview'))
 .map(line=>line.trim());
const browser=await chromium.connectOverCDP('http://127.0.0.1:9227',{noDefaults:true,timeout:20000});
const record=[];
try {
 const p=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='https://dartscore-pro.vercel.app/');
 assert.ok(p,'Physical S23 WebView not attached');
 p.setDefaultTimeout(12000);
 await p.waitForFunction(()=>document.querySelectorAll('.playerDragHandle').length>=2);
 const toggle=p.locator('.vibrationToggle').first();
 const handles=p.locator('.playerDragHandle');
 const initial={screen:await p.locator('.container').getAttribute('data-screen'),
   premium:await p.locator('.container').getAttribute('data-premium'),
   pressed:await toggle.getAttribute('aria-pressed'),
   players:await handles.count(),
   nativeHaptic:await p.evaluate(()=>typeof window.DartScoreAndroid?.hapticTap)};
 console.log('INITIAL',JSON.stringify(initial));
 assert.equal(initial.screen,'lobby');
 assert.equal(initial.premium,'1','Physical S23 must be in Premium UI mode');
 assert.equal(initial.nativeHaptic,'function');
 async function setVibration(enabled){
  let current=(await toggle.getAttribute('aria-pressed'))==='true';
  if(current!==enabled)await toggle.click();
  await p.waitForFunction(v=>document.querySelector('.vibrationToggle')?.getAttribute('aria-pressed')===(v?'true':'false'),enabled);
  await p.waitForTimeout(90);
  assert.equal(await p.evaluate(()=>localStorage.getItem('dspHapticsEnabled')),String(enabled));
 }
 async function nativeDrag(label,enabled) {
  await setVibration(enabled);
  const namesBefore=await p.locator('.playerName input').evaluateAll(els=>els.map(e=>e.value));
  await handles.first().scrollIntoViewIfNeeded();
  const a=await handles.first().boundingBox();
  const b=await handles.nth(1).boundingBox();
  assert.ok(a&&b);
  const x=a.x+a.width/2, y=a.y+a.height/2, endY=b.y+b.height/2;
  const vibrBefore=matches();
  const cdp=await p.context().newCDPSession(p);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  await p.waitForTimeout(520);
  const active=await p.locator('.playerRow.dragging').count();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:endY}]});
  await p.waitForTimeout(110);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await p.waitForTimeout(220);
  const namesAfter=await p.locator('.playerName input').evaluateAll(els=>els.map(e=>e.value));
  const vibrAfter=matches();
  const changed=JSON.stringify(vibrAfter)!==JSON.stringify(vibrBefore);
  const result={label,enabled,active,changed,numberBefore:vibrBefore.length,numberAfter:vibrAfter.length,
    lastVibrations:vibrAfter.slice(-2),playersMoved:namesAfter[0]===namesBefore[1]&&namesAfter[1]===namesBefore[0],
    before:namesBefore.slice(0,2),after:namesAfter.slice(0,2)};
  console.log('TEST',JSON.stringify(result));
  record.push(result);
  fs.writeFileSync(root+'/physical-haptic-off-on-off.json',JSON.stringify(record,null,2));
  assert.equal(active,1,label+' should activate reorder');
  assert.equal(result.playersMoved,true,label+' should reorder players');
  assert.equal(changed,enabled,label+': native vibrator manager change should equal toggle state');
 }
 await nativeDrag('OFF (first)',false);
 await nativeDrag('ON',true);
 await nativeDrag('OFF (again)',false);
 console.log('FINAL PASS: S23 OFFâ€“ONâ€“OFF, native vibration history matches switch and drag works.');
}finally{
 fs.writeFileSync(root+'/physical-haptic-off-on-off.json',JSON.stringify(record,null,2));
 await browser.close();
}

