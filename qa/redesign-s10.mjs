// Device-specific check: isolated UI TEST app with six players, forwarded CDP on 9226.
// Banner visibility is required; native interruptions/no-fill intentionally fail this check.
import assert from 'node:assert/strict';import fs from 'node:fs';import{execFileSync}from'node:child_process';
const{chromium}=await import(process.env.DARTSCORE_PLAYWRIGHT_MODULE||'playwright');
const out='build/redesign-s10';fs.mkdirSync(out,{recursive:true});const results=[];
const adb=(...args)=>execFileSync('adb',['-s','RF8M20CL3WY',...args],{encoding:'utf8',timeout:25000});
const b=await chromium.connectOverCDP('http://127.0.0.1:9226',{noDefaults:true,timeout:15000});
try{
 const p=b.contexts()[0].pages().find(p=>p.url()==='https://dartscore-pro.vercel.app/');assert.ok(p);p.setDefaultTimeout(20000);
 const css=await p.evaluate(()=>[...document.styleSheets].map(s=>s.href));assert.ok(css.some(x=>x?.includes('index-KDB_Q0YB.css')),'Final built stylesheet must be installed');
 for(const mode of['classic','cricket','around','roulette','rouletteDouble']){
  await p.evaluate(()=>{if(document.querySelector('.container[data-screen="game"]'))document.querySelector('.gameBack').click();});
  await p.waitForFunction(()=>Boolean(document.querySelector('.lobbyWrap')));
  await p.evaluate(()=>{for(const e of document.querySelectorAll('.utilityHeader button[aria-pressed="true"]'))e.click();});
  await p.evaluate(()=>document.querySelector('.lobbyModeGroup .themedSelectTrigger').click());
  await p.waitForFunction(()=>document.querySelectorAll('.themedSelectOption').length===5);
  await p.evaluate(index=>document.querySelectorAll('.themedSelectOption')[index].click(),['classic','cricket','around','roulette','rouletteDouble'].indexOf(mode));
  await p.evaluate(()=>document.querySelector('.lobbyStartActions .green').click());await p.waitForFunction(()=>Boolean(document.querySelector('.container[data-screen="game"]')));
  if(mode==='cricket')for(let n=0;n<3;n++){await p.evaluate(()=>[...document.querySelectorAll('.padPane .key')].find(e=>e.textContent==='15').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',isPrimary:true})));await p.waitForTimeout(140);}
  await p.waitForFunction(()=>innerHeight<800,null,{timeout:20000});
  const measure=await p.evaluate(()=>{
   const issues=[];const pane=document.querySelector('.padPane');
   for(const s of['.container','.utilityHeader','.gameTopBar','.padPane','.playersPane','.cricketWrap'])for(const e of document.querySelectorAll(s)){const r=e.getBoundingClientRect();if(r.left<0||r.right>innerWidth+1||r.bottom>innerHeight+1)issues.push({selector:s,left:r.left,right:r.right,bottom:r.bottom});}
   if(pane){const r=pane.getBoundingClientRect();for(const e of pane.querySelectorAll('button')){const k=e.getBoundingClientRect();if(k.right>r.right+1||k.bottom>r.bottom+1||e.scrollWidth>e.clientWidth+1)issues.push({text:e.textContent});}}
   return{width:innerWidth,height:innerHeight,premium:document.querySelector('.container').dataset.premium,css:[...document.styleSheets].map(s=>s.href),players:document.querySelectorAll('.playerCard,.playerCol').length,closed:document.querySelectorAll('.cricketClosedMark').length,issues};
  });assert.equal(measure.premium,'0');assert.equal(measure.players,6);assert.deepEqual(measure.issues,[]);if(mode==='cricket')assert.equal(measure.closed,1);
  adb('shell','screencap','-p',`/sdcard/dart-ui-${mode}.png`);adb('pull',`/sdcard/dart-ui-${mode}.png`,`${out}/${mode}-native.png`);
  await p.screenshot({path:`${out}/${mode}-webview.png`});results.push({mode,...measure,status:'pass'});fs.writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log('PASS S10 Free',mode,measure.width,measure.height);
 }
}finally{await b.close();}
