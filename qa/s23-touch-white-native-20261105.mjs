import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {chromium} from 'file:///C:/Users/Mirek/Documents/ChatGPT/Darts/.qa-runtime/node_modules/playwright/index.mjs';
const outdir='build/ui-physical-qa-20261105/s23';
fs.mkdirSync(outdir,{recursive:true});
const adb=(...args)=>execFileSync('C:/Users/Mirek/AppData/Local/Android/Sdk/platform-tools/adb.exe',['-s','RFCW805VSVD',...args],{encoding:'utf8',timeout:40000});
function vibHistory(){return adb('shell','dumpsys','vibrator_manager').split(/\r?\n/).filter(s=>s.includes('com.randis2288.dartscorepro.uireview')).map(s=>s.trim());}
const browser=await chromium.connectOverCDP('http://127.0.0.1:9227',{noDefaults:true,timeout:20000});
const results=[];
let page,session;
try {
 for(const p of browser.contexts().flatMap(c=>c.pages())){
   if(p.url().startsWith('https://dartscore-pro.vercel.app')&&await p.evaluate(()=>document.visibilityState)==='visible'){page=p;break;}
 }
 assert.ok(page,'Visible DartScore Premium WebView required');
 const initial=await page.evaluate(()=>({screen:document.querySelector('.container')?.dataset.screen,mode:document.querySelector('.container')?.dataset.mode,premium:document.querySelector('.container')?.dataset.premium,keyCount:document.querySelectorAll('.roundTotalKeypad [data-keypad-number]').length,activeToggle:document.querySelector('.vibrationToggle')?.getAttribute('aria-pressed'),innerWidth,innerHeight}));
 console.log('INITIAL',JSON.stringify(initial));
 assert.equal(initial.screen,'game');assert.equal(initial.mode,'classic');assert.equal(initial.premium,'1');assert.equal(initial.keyCount,10);
 session=await page.context().newCDPSession(page);
 async function press(label,on,digit,screenshot=false){
   if((await page.locator('.vibrationToggle').getAttribute('aria-pressed'))!==(on?'true':'false'))await page.evaluate(()=>document.querySelector('.vibrationToggle').click());
   await page.waitForFunction(on=>document.querySelector('.vibrationToggle')?.getAttribute('aria-pressed')===(on?'true':'false'),on);
   const key=page.locator('.roundTotalKeypad [data-keypad-number]').filter({hasText:new RegExp('^'+digit+'$')}).first();
   assert.equal(await key.count(),1,'digit '+digit+' button exists');
   const box=await key.boundingBox(); assert.ok(box);
   assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=initial.innerWidth+2&&box.y+box.height<=initial.innerHeight+2,JSON.stringify(box));
   const touch={x:box.x+box.width/2,y:box.y+box.height/2};
   const before=vibHistory();
   await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]});
   await page.waitForTimeout(85);
   const css=await key.evaluate(e=>({pressed:e.classList.contains('pressed'),bg:getComputedStyle(e).backgroundColor,fg:getComputedStyle(e).color,scale:getComputedStyle(e).transform}));
   if(screenshot){
     adb('shell','screencap','-p','/sdcard/Download/dsp-s23-touch-white.png');
     adb('pull','/sdcard/Download/dsp-s23-touch-white.png',outdir+'/white-touch-held-native.png');
   }
   await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForTimeout(200);
   const after=vibHistory();
   const ui=await page.evaluate(()=>({input:document.querySelector('.roundTotalKeypad')?.parentElement?.textContent?.slice(0,130),screen:document.querySelector('.container')?.dataset.screen,mode:document.querySelector('.container')?.dataset.mode,activeToggle:document.querySelector('.vibrationToggle')?.getAttribute('aria-pressed')}));
   const actual=after.length-before.length;
   const record={label,on,digit,css,vibrationRecordsAdded:actual,latest:after.slice(-1),ui};
   results.push(record);
   console.log('TOUCH',JSON.stringify({label,on,digit,css,vibrationRecordsAdded:actual,ui}));
   assert.equal(css.pressed,true,label+': white pressed class');
   assert.equal(css.bg,'rgb(255, 255, 255)',label+': white fill');
   assert.equal(actual,on?1:0,label+': haptic follows toggle');
   assert.equal(ui.screen,'game');
   return record;
 }
 await press('Vypnuto',false,'1');
 await press('Zapnuto',true,'2',true);
 await press('Opět vypnuto',false,'3');
 await page.evaluate(()=>document.querySelector('.gameBack').click());
 await page.waitForFunction(()=>!!document.querySelector('.lobbyWrap'));
 console.log('SUCCESS: physical S23 white touch + vibration OFF/ON/OFF, returned to Premium lobby');
}finally{
 fs.writeFileSync(outdir+'/physical-white-touch-off-on-off.json',JSON.stringify(results,null,2));
 if(session)await session.detach().catch(()=>{});
 await browser.close();
}
