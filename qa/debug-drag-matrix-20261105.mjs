import {chromium} from 'file:///C:/Users/Mirek/Documents/ChatGPT/Darts/.qa-runtime/node_modules/playwright/index.mjs';
const b=await chromium.launch();
const c=await b.newContext({viewport:{width:320,height:800},isMobile:true,hasTouch:true});
const p=await c.newPage();p.on('pageerror',e=>console.log('PAGEERROR',e.message));
try{
 await p.goto('http://127.0.0.1:4193/',{waitUntil:'domcontentloaded'});
 console.log('BEFORE',await p.evaluate(()=>({screen:document.querySelector('.container')?.dataset.screen,rows:document.querySelectorAll('.playerRow').length,href:location.href,html:document.body.textContent?.slice(0,180)})));
 await p.evaluate(()=>{localStorage.clear();localStorage.setItem('lobbyDefaultsVersion','1.1.62');localStorage.setItem('premium','false');localStorage.setItem('lobby',JSON.stringify({lang:'cs',mode:'rouletteDouble',ai:'off',randomOrder:false,players:Array.from({length:6},(_,i)=>({id:'qa-drag-'+i,name:'Player '+(i+1)}))}));});
 await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(1500);
 console.log('AFTER',await p.evaluate(()=>({screen:document.querySelector('.container')?.dataset.screen,rows:document.querySelectorAll('.playerRow').length,href:location.href,html:document.body.textContent?.slice(0,240),local:localStorage.getItem('lobby')?.slice(0,260)})));
}finally{await b.close()}
