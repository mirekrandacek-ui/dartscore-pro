import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {chromium} from 'file:///C:/Users/Mirek/Documents/ChatGPT/Darts/.qa-runtime/node_modules/playwright/index.mjs';

const base='build/ui-physical-qa-20261105/s23';
const adb=(...args)=>execFileSync('C:/Users/Mirek/AppData/Local/Android/Sdk/platform-tools/adb.exe',
 ['-s','RFCW805VSVD',...args],{encoding:'utf8',timeout:35000});
const vibrations=()=>adb('shell','dumpsys','vibrator_manager').split(/\r?\n/)
 .filter(line=>line.includes('com.randis2288.dartscorepro.uireview'));
const browser=await chromium.connectOverCDP('http://127.0.0.1:9227',{noDefaults:true,timeout:20000});
const results=[];
try{
 const p=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='https://dartscore-pro.vercel.app/');
 assert.ok(p);p.setDefaultTimeout(15000);
 if(await p.locator('.container').getAttribute('data-screen')==='game'){
  await p.evaluate(()=>document.querySelector('.gameBack').click());
 }
 await p.waitForFunction(()=>!!document.querySelector('.lobbyWrap'));
 // Use the same persisted lobby mode that the app restores after native startup.
 const originalLobby=await p.evaluate(()=>localStorage.getItem('lobby'));
 await p.evaluate(()=>{
   const s=JSON.parse(localStorage.getItem('lobby')||'{}');
   localStorage.setItem('lobby',JSON.stringify({...s,mode:'classic',scoreInputMode:'round'}));
 });
 await p.reload({waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>document.querySelector('.container')?.dataset.mode==='classic'&&!!document.querySelector('.lobbyWrap'));
 await p.evaluate(()=>document.querySelector('.lobbyStartActions .green').click());
 await p.waitForFunction(()=>document.querySelector('.container')?.dataset.screen==='game'&&document.querySelector('.container')?.dataset.mode==='classic');
 assert.equal(await p.locator('.container').getAttribute('data-premium'),'1');
 const key=p.locator('.padPane [data-keypad-number]').first();
 await key.waitFor();
 const toggle=p.locator('.vibrationToggle');
 const session=await p.context().newCDPSession(p);
 async function touchKey(label,enabled){
  if((await toggle.getAttribute('aria-pressed')==='true')!==enabled)await p.evaluate(()=>document.querySelector('.vibrationToggle').click());
  await p.waitForFunction(yes=>document.querySelector('.vibrationToggle')?.getAttribute('aria-pressed')===(yes?'true':'false'),enabled);
  await p.waitForTimeout(100);
  const v0=vibrations();
  const box=await key.boundingBox();assert.ok(box);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});
  await p.waitForTimeout(75);
  const paint=await key.evaluate(el=>({white:getComputedStyle(el).backgroundColor,pressed:el.classList.contains('pressed')}));
  assert.equal(paint.white,'rgb(255, 255, 255)');
  assert.equal(paint.pressed,true);
  if(label==='ON'){
   adb('shell','screencap','-p','/sdcard/Download/dsp-s23-white-key.png');
   adb('pull','/sdcard/Download/dsp-s23-white-key.png',base+'/white-key-native.png');
  }
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await p.waitForTimeout(170);
  const v1=vibrations();
  const vibration=JSON.stringify(v1)!==JSON.stringify(v0);
  const data={label,enabled,vibration,white:true,press:paint.pressed,historyBefore:v0.length,historyAfter:v1.length};
  results.push(data);
  console.log('KEY',JSON.stringify(data));
  assert.equal(vibration,enabled,label+' native vibrator history');
 }
 await touchKey('OFF initial',false);
 await touchKey('ON',true);
 await touchKey('OFF again',false);
 await p.evaluate(()=>document.querySelector('.gameBack').click());
 await p.waitForFunction(()=>!!document.querySelector('.lobbyWrap'));
 await p.evaluate(v=>localStorage.setItem('lobby',v),originalLobby);
 await p.reload({waitUntil:'domcontentloaded'});
 console.log('SUCCESS S23 keypad OFF/ON/OFF, visible white effect on each touch');
}finally{
 fs.writeFileSync(base+'/keypad-white-haptics.json',JSON.stringify(results,null,2));
 await browser.close();
}
