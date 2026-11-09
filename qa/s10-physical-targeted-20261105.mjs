import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {chromium} from 'file:///C:/Users/Mirek/Documents/ChatGPT/Darts/.qa-runtime/node_modules/playwright/index.mjs';
const root='build/ui-physical-qa-20261105/s10';
const adb=(...args)=>execFileSync('C:/Users/Mirek/AppData/Local/Android/Sdk/platform-tools/adb.exe',['-s','RF8M20CL3WY',...args],{encoding:'utf8',timeout:30000});
const b=await chromium.connectOverCDP('http://127.0.0.1:9226',{noDefaults:true,timeout:20000});
const results=[];
try{
 const p=b.contexts()[0].pages().find(x=>x.url()==='https://dartscore-pro.vercel.app/');
 assert.ok(p);p.setDefaultTimeout(20000);
 async function fixture(mod){
   await p.evaluate(mod=>{
     const old=JSON.parse(localStorage.getItem('lobby')||'{}');
     localStorage.setItem('lobbyDefaultsVersion','1.1.62');
     localStorage.setItem('lobby',JSON.stringify({...old,lang:'cs',mode:mod.mode,playerMode:mod.playerMode,scoreInputMode:mod.scoreInputMode,ai:'off',randomOrder:false,players:Array.from({length:6},(_,i)=>({id:'s10qa-'+(i+1),name:'Test '+(i+1),team:i%2?'B':'A'}))}));
   },mod);
   await p.reload({waitUntil:'domcontentloaded'});
   await p.waitForFunction(mode=>document.querySelector('.container')?.dataset.screen==='lobby'&&document.querySelector('.container')?.dataset.mode===mode,mod.mode);
 }
 await fixture({mode:'classic',playerMode:'teams',scoreInputMode:'round'});
 await p.evaluate(()=>document.querySelector('.lobbyStartActions .green').click());
 await p.locator('.roundTotalKeypad').waitFor();
 const round=await p.evaluate(()=>{
  const cap=document.querySelector('.gameOutCaption'), val=document.querySelector('.gameOutValue'), stats=[...document.querySelectorAll('.teamPane .playerStats')];
  const keys=[...document.querySelectorAll('.roundTotalKeypad [data-keypad-number]')], rect=e=>e.getBoundingClientRect();
  const root=document.querySelector('.container');
  return {screen:root.dataset.screen,premium:root.dataset.premium,teams:document.querySelectorAll('.teamPane .playerCard').length,
    out:{caption:cap?.textContent,value:val?.textContent,nowrap:getComputedStyle(val).whiteSpace,stacked:rect(val).top>=rect(cap).bottom-2},
    statsFont:stats.map(e=>getComputedStyle(e).fontSize), statsOverflow:stats.some(e=>e.scrollWidth>e.clientWidth+1),
    keyCount:keys.length,keySize:keys.map(e=>getComputedStyle(e).fontSize).slice(0,4),
    backColor:getComputedStyle(document.querySelector('.roundTotalKeypad .backspace')).backgroundImage,
    width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth};
 });
 console.log('TEAMS ROUND',JSON.stringify(round));
 assert.equal(round.premium,'0');assert.equal(round.teams,2);assert.equal(round.keyCount,10);
 assert.ok(round.out.stacked&&round.out.nowrap==='nowrap'&&!round.statsOverflow&&round.scrollWidth<=round.width+1);
 assert.match(round.backColor,/gradient/);
 adb('shell','screencap','-p','/sdcard/Download/dsp-s10-teams-round.png');adb('pull','/sdcard/Download/dsp-s10-teams-round.png',root+'/teams-round-native.png');
 for(const digit of ['6','0'])await p.locator('.roundTotalKeypad [data-keypad-number]').filter({hasText:new RegExp('^'+digit+'$')}).click();
 await p.locator('.roundTotalKeypad button').filter({hasText:/^OK$/}).click();
 const score=await p.locator('.teamPane .playerScore').first().textContent();
 assert.equal(score,'441','60 scored from 501 should leave 441');
 results.push({test:'teams-round',round,score,result:'pass'});
 console.log('ROUND SCORE PASS',score);
 await fixture({mode:'rouletteDouble',playerMode:'individual',scoreInputMode:'darts'});
 await p.evaluate(()=>document.querySelector('.lobbyStartActions .green').click());
 await p.locator('.roulettePane .playerStats').first().waitFor();
 const roulette=await p.evaluate(()=>{
  const e=document.querySelector('.roulettePane .playerStats');return {label:document.querySelector('.roulettePane .rouletteScore')?.textContent,font:getComputedStyle(e).fontSize,column:getComputedStyle(e).flexDirection,viewport:innerWidth,scroll:document.documentElement.scrollWidth,players:document.querySelectorAll('.roulettePane .playerCard').length};
 });
 assert.match(roulette.label,/^Body:/);assert.equal(roulette.column,'column');assert.ok(roulette.scroll<=roulette.viewport+1);assert.equal(roulette.players,6);
 adb('shell','screencap','-p','/sdcard/Download/dsp-s10-roulette-double-fixed.png');adb('pull','/sdcard/Download/dsp-s10-roulette-double-fixed.png',root+'/rouletteDouble-fixed-native.png');
 results.push({test:'rouletteDouble',roulette,result:'pass'});
 console.log('ROULETTE DOUBLE PASS',JSON.stringify(roulette));
}finally{fs.writeFileSync(root+'/targeted-results.json',JSON.stringify(results,null,2));await b.close()}
