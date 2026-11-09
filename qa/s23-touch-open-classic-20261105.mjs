import assert from 'node:assert/strict';
import {chromium} from 'file:///C:/Users/Mirek/Documents/ChatGPT/Darts/.qa-runtime/node_modules/playwright/index.mjs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9227',{noDefaults:true,timeout:20000});
try{
 const pages=b.contexts().flatMap(c=>c.pages()).filter(p=>p.url().startsWith('https://dartscore-pro.vercel.app'));
 let p;
 for(const pg of pages){if(await pg.evaluate(()=>document.visibilityState)==='visible'){p=pg;break}}
 assert.ok(p,'Visible UI page required');
 let before=await p.evaluate(()=>({screen:document.querySelector('.container')?.dataset.screen,mode:document.querySelector('.container')?.dataset.mode,visible:document.visibilityState,premium:document.querySelector('.container')?.dataset.premium,start:!!document.querySelector('.lobbyStartActions .green')}));
 console.log('BEFORE',JSON.stringify(before));
 assert.equal(before.premium,'1'); assert.equal(before.mode,'classic');
 if(before.screen==='lobby'){await p.evaluate(()=>document.querySelector('.lobbyStartActions .green').click());await p.waitForFunction(()=>document.querySelector('.container')?.dataset.screen==='game',{timeout:10000})}
 let after=await p.evaluate(()=>({screen:document.querySelector('.container')?.dataset.screen,mode:document.querySelector('.container')?.dataset.mode,vis:document.visibilityState,numbers:document.querySelectorAll('.padPane [data-keypad-number]').length,round:!!document.querySelector('.roundTotalKeypad'),toggle:document.querySelector('.vibrationToggle')?.getAttribute('aria-pressed'),premium:document.querySelector('.container')?.dataset.premium}));
 console.log('AFTER',JSON.stringify(after));
}finally{await b.close()}
