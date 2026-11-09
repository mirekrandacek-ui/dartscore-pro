import {chromium} from 'file:///C:/Users/Mirek/Documents/ChatGPT/Darts/.qa-runtime/node_modules/playwright/index.mjs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9227',{noDefaults:true,timeout:20000});
try{let i=0;for(const c of b.contexts())for(const p of c.pages()) {
 if(!p.url().startsWith('https://dartscore-pro.vercel.app')) continue;
 try {const x=await p.evaluate(()=>({vis:document.visibilityState,focus:document.hasFocus(),screen:document.querySelector('.container')?.dataset.screen,mode:document.querySelector('.container')?.dataset.mode,premium:document.querySelector('.container')?.dataset.premium,inputs:document.querySelectorAll('.padPane [data-keypad-number]').length,round:document.querySelectorAll('.roundTotalKeypad [data-keypad-number]').length,lobby:!!document.querySelector('.lobbyWrap'),haptics:document.querySelector('.vibrationToggle')?.getAttribute('aria-pressed')})); console.log(i++,JSON.stringify(x));}catch(e){console.log('ERROR',String(e));}
}}finally{await b.close()}
