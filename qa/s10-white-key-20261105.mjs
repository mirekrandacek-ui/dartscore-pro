import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {chromium} from 'file:///C:/Users/Mirek/Documents/ChatGPT/Darts/.qa-runtime/node_modules/playwright/index.mjs';
const adb=(...args)=>execFileSync('C:/Users/Mirek/AppData/Local/Android/Sdk/platform-tools/adb.exe',['-s','RF8M20CL3WY',...args],{encoding:'utf8',timeout:30000});
const b=await chromium.connectOverCDP('http://127.0.0.1:9226',{noDefaults:true,timeout:20000});
try {
 const p=b.contexts()[0].pages().find(x=>x.url()==='https://dartscore-pro.vercel.app/');
 assert.ok(p);assert.equal(await p.locator('.container').getAttribute('data-screen'),'game');
 const key=p.locator('.padPane [data-keypad-number]').nth(1);
 const r=await key.boundingBox();assert.ok(r);
 const c=await p.context().newCDPSession(p);
 await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2}]});
 await p.waitForTimeout(70);
 const during=await key.evaluate(e=>({pressed:e.classList.contains('pressed'),background:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color}));
 adb('shell','screencap','-p','/sdcard/Download/dsp-s10-white-key.png');
 adb('pull','/sdcard/Download/dsp-s10-white-key.png','build/ui-physical-qa-20261105/s10/white-key-held.png');
 await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await p.waitForTimeout(150);
 const after=await p.evaluate(()=>({score:document.querySelector('.playerCard.active .playerScore')?.textContent,firstThrows:[...document.querySelectorAll('.playerCard.active .dartBox')].map(e=>e.textContent)}));
 const result={during,after};fs.writeFileSync('build/ui-physical-qa-20261105/s10/white-key.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result,null,2));
 assert.equal(during.pressed,true);assert.equal(during.background,'rgb(255, 255, 255)');
} finally {await b.close()}
