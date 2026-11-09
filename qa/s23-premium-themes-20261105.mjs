import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {chromium} from 'file:///C:/Users/Mirek/Documents/ChatGPT/Darts/.qa-runtime/node_modules/playwright/index.mjs';

const adb=(...args)=>execFileSync('C:/Users/Mirek/AppData/Local/Android/Sdk/platform-tools/adb.exe',
  ['-s','RFCW805VSVD',...args],{encoding:'utf8',timeout:35000});
const root='build/ui-physical-qa-20261105/s23';
const browser=await chromium.connectOverCDP('http://127.0.0.1:9227',{noDefaults:true,timeout:20000});
const result={};
let savedLobby=null;
try{
 const p=browser.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='https://dartscore-pro.vercel.app/');
 assert.ok(p);p.setDefaultTimeout(18000);
 if(await p.locator('.container').getAttribute('data-screen')==='game'){
   await p.evaluate(()=>document.querySelector('.gameBack').click());
   await p.waitForFunction(()=>!!document.querySelector('.lobbyWrap'));
 }
 const prior=await p.evaluate(()=>{
   const el=document.documentElement;return {lobby:localStorage.getItem('lobby'),bg:el.style.getPropertyValue('--bg'),accent:el.style.getPropertyValue('--accent')};
 });
 savedLobby=prior.lobby;
 const badge=await p.locator('.premiumIndicator').textContent();
 const panel=await p.locator('.premiumCard').count();
 const purchase=await p.locator('.premiumActions button').count();
 const swatches=p.locator('.premiumSwatches button');
 const count=await swatches.count();
 assert.equal(badge,'Premium');assert.equal(panel,1);assert.equal(purchase,1);assert.equal(count,5);
 result.premium={badge,panel,purchaseButtons:purchase,themeCount:count,initialBg:prior.bg,initialAccent:prior.accent};
 await p.evaluate(()=>{if(!document.querySelector('.premiumCard').innerText.includes('Premium') || !document.querySelector('.premiumCard').querySelector('.premiumAppearance'))throw Error('Premium controls not visible');document.querySelector('.premiumActions button').click()});
 result.features=await p.locator('.premiumCard').innerText();
 assert.ok(result.features.length>15,'premium features visible');
 // Click each Premium theme on the real S23 WebView, observe CSS variables.
 const themes=[
  {key:'black',background:'#0e0e0e',accent:'#16a34a'},
  {key:'green',background:'#0e2d17',accent:'#16a34a'},
  {key:'blue',background:'#0c1a36',accent:'#3b82f6'},
  {key:'red',background:'#3b0d0d',accent:'#ef4444'},
  {key:'purple',background:'#28104d',accent:'#8b5cf6'}
 ];
 result.themes=[];
 for(let i=0;i<themes.length;i++){
  await p.evaluate(i=>document.querySelectorAll('.premiumSwatches button')[i].click(),i);
  await p.waitForTimeout(60);
  const css=await p.evaluate(()=>{
    const s=document.documentElement.style;return {background:s.getPropertyValue('--bg'),accent:s.getPropertyValue('--accent')};
  });
  assert.equal(css.background,themes[i].background,themes[i].key);
  assert.equal(css.accent,themes[i].accent,themes[i].key);
  const row=await p.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert.ok(row.scrollWidth<=row.width+1);
  result.themes.push({...themes[i],actual:css});
  console.log('PASS PREMIUM THEME',themes[i].key,JSON.stringify(css));
 }
 // Restore the original appearance.
 const restoreIdx=themes.findIndex(t=>t.background===prior.bg && t.accent===prior.accent);
 if(restoreIdx>=0)await p.evaluate(i=>document.querySelectorAll('.premiumSwatches button')[i].click(),restoreIdx);
 await p.evaluate(()=>document.querySelector('.premiumActions button').click());
 adb('shell','screencap','-p','/sdcard/Download/dsp-s23-premium-settings.png');
 adb('pull','/sdcard/Download/dsp-s23-premium-settings.png',root+'/premium-settings-native.png');
 console.log('PREMIUM RESULT',JSON.stringify({premium:result.premium,swatches:result.themes.length,features:result.features.slice(0,160)}));
}finally{
 fs.writeFileSync(root+'/premium-themes.json',JSON.stringify(result,null,2));
 await browser.close();
}
