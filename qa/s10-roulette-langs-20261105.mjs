import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {chromium} from 'file:///C:/Users/Mirek/Documents/ChatGPT/Darts/.qa-runtime/node_modules/playwright/index.mjs';
const adb=(...args)=>execFileSync('C:/Users/Mirek/AppData/Local/Android/Sdk/platform-tools/adb.exe',['-s','RF8M20CL3WY',...args],{encoding:'utf8',timeout:30000});
const dir='build/ui-physical-qa-20261105/s10';
const languages=['cs','en','de','es','nl','ru','zh'],result=[];
const b=await chromium.connectOverCDP('http://127.0.0.1:9226',{noDefaults:true,timeout:20000});
try{
 const p=b.contexts()[0].pages().find(x=>x.url()==='https://dartscore-pro.vercel.app/');
 assert.ok(p);
 for(const lang of languages){
  await p.evaluate(lang=>{
   const old=JSON.parse(localStorage.getItem('lobby')||'{}');
   localStorage.setItem('lobbyDefaultsVersion','1.1.62');
   localStorage.setItem('lobby',JSON.stringify({...old,lang,mode:'rouletteDouble',scoreInputMode:'darts',playerMode:'individual',ai:'off',randomOrder:false,players:Array.from({length:6},(_,i)=>({id:'s10ru-'+i,name:'Test '+(i+1)}))}));
  },lang);
  await p.reload({waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>document.querySelector('.container')?.dataset.screen==='lobby');
  await p.evaluate(()=>document.querySelector('.lobbyStartActions .green').click());
  await p.waitForFunction(()=>document.querySelector('.container')?.dataset.screen==='game'&&document.querySelector('.container')?.dataset.mode==='rouletteDouble');
  const info=await p.evaluate(()=>{
   const stats=document.querySelector('.roulettePane .playerStats');
   return {score:document.querySelector('.roulettePane .rouletteScore')?.textContent,playerCount:document.querySelectorAll('.roulettePane .playerCard').length,columns:getComputedStyle(stats).flexDirection,font:getComputedStyle(stats).fontSize,statsOverflow:stats.scrollWidth>stats.clientWidth+1,scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth,haptics:document.querySelector('.vibrationToggle')?.getAttribute('aria-pressed')};
  });
  assert.equal(info.playerCount,6);assert.equal(info.columns,'column');assert.equal(info.statsOverflow,false);assert.ok(info.scrollWidth<=info.viewport+1);
  assert.ok(info.score.includes(':'));
  if(['cs','de'].includes(lang)){
   await p.waitForTimeout(250);
   adb('shell','screencap','-p','/sdcard/Download/dsp-s10-roulette-'+lang+'.png');
   adb('pull','/sdcard/Download/dsp-s10-roulette-'+lang+'.png',dir+'/rouletteDouble-'+lang+'-native.png');
  }
  result.push({lang,...info,status:'pass'});console.log('PASS',lang,JSON.stringify(info));
 }
 await p.evaluate(()=>{
  const old=JSON.parse(localStorage.getItem('lobby')||'{}');
  localStorage.setItem('lobby',JSON.stringify({...old,lang:'cs'}));
 });
 await p.reload({waitUntil:'domcontentloaded'});
}finally{fs.writeFileSync(dir+'/roulette-languages.json',JSON.stringify(result,null,2));await b.close();}
