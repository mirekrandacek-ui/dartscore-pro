import {chromium} from 'file:///C:/Users/Mirek/Documents/ChatGPT/Darts/.qa-runtime/node_modules/playwright/index.mjs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9227',{noDefaults:true,timeout:20000});
try{for(const c of b.contexts())for(const p of c.pages()){
const info=await p.evaluate(()=>({url:location.href,screen:document.querySelector('.container')?.dataset.screen,premium:document.querySelector('.container')?.dataset.premium,premiumStorage:localStorage.getItem('premium'),haptics:document.querySelector('.vibrationToggle')?.getAttribute('aria-pressed'),players:document.querySelectorAll('.playerRow').length,lang:document.querySelector('.languagePicker')?.textContent,width:innerWidth,height:innerHeight,banner:document.querySelector('.fakeBanner')?.textContent,native:!!window.DartScoreAndroid}));
console.log(JSON.stringify(info,null,2));
}}finally{await b.close()}
