import assert from 'node:assert/strict';
import {chromium} from 'file:///C:/Users/Mirek/Documents/ChatGPT/Darts/.qa-runtime/node_modules/playwright/index.mjs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9226',{noDefaults:true,timeout:20000});
try{
 const pages=b.contexts()[0].pages().filter(x=>x.url()==='https://dartscore-pro.vercel.app/');
 const p=pages[0];assert.ok(p);
 const initial=await p.evaluate(()=>({screen:document.querySelector('.container')?.dataset.screen,mode:document.querySelector('.container')?.dataset.mode,round:!!document.querySelector('.roundTotalKeypad'),teams:document.querySelectorAll('.teamPane .playerCard').length}));
 console.log('INITIAL',JSON.stringify(initial));assert.equal(initial.round,true);
 for(const digit of ['6','0']){
  const found=await p.evaluate(d=>{const e=[...document.querySelectorAll('.roundTotalKeypad [data-keypad-number]')].find(el=>el.textContent.trim()===d);e?.click();return !!e},digit);
  assert.ok(found);
 }
 const before=await p.evaluate(()=>({display:document.querySelector('.roundTotalDisplay')?.textContent||'',score:document.querySelector('.teamPane .playerScore')?.textContent}));
 console.log('INPUT',JSON.stringify(before));
 const foundOK=await p.evaluate(()=>{const e=[...document.querySelectorAll('.roundTotalKeypad button')].find(el=>el.textContent.trim()==='OK');e?.click();return !!e});
 assert.ok(foundOK);
 await p.waitForTimeout(150);
 const after=await p.evaluate(()=>({score:document.querySelector('.teamPane .playerScore')?.textContent,display:document.querySelector('.roundTotalDisplay')?.textContent||''}));
 console.log('AFTER',JSON.stringify(after));
 assert.equal(after.score?.trim(),'441');
}finally{await b.close()}
