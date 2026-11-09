import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {chromium} from 'file:///C:/Users/Mirek/Documents/ChatGPT/Darts/.qa-runtime/node_modules/playwright/index.mjs';
const root='build/ui-physical-qa-20261105/s23';
fs.mkdirSync(root,{recursive:true});
const adb=(...args)=>execFileSync('C:/Users/Mirek/AppData/Local/Android/Sdk/platform-tools/adb.exe',['-s','RFCW805VSVD',...args],{encoding:'utf8',timeout:45000});
const browser=await chromium.connectOverCDP('http://127.0.0.1:9227',{noDefaults:true,timeout:20000});
const results=[];
try{
  const page=browser.contexts()[0].pages().find(x=>x.url()==='https://dartscore-pro.vercel.app/');
  assert.ok(page,'Real S10 app WebView required');
  page.setDefaultTimeout(20000);
  const base=await page.evaluate(()=>({premium:document.querySelector('.container').dataset.premium,players:document.querySelectorAll('.playerRow').length,haptic:document.querySelector('.vibrationToggle')?.getAttribute('aria-pressed'),style:[...document.styleSheets].map(s=>s.href).find(s=>s?.includes('assets/index-'))}));
  assert.equal(base.premium,'1');assert.equal(base.players,6);assert.ok(base.style);
  console.log('S23 BASE',JSON.stringify(base));
  for(const [index,mode] of ['classic','cricket','around','roulette','rouletteDouble'].entries()){
    await page.evaluate(()=>{
      if(document.querySelector('.container[data-screen="game"]'))document.querySelector('.gameBack').click();
    });
    await page.waitForFunction(()=>!!document.querySelector('.lobbyWrap'));
    await page.evaluate(()=>document.querySelector('.lobbyModeGroup .themedSelectTrigger').click());
    await page.waitForFunction(()=>document.querySelectorAll('.themedSelectOption').length===5);
    await page.evaluate(i=>document.querySelectorAll('.themedSelectOption')[i].click(),index);
    await page.evaluate(()=>document.querySelector('.lobbyStartActions .green').click());
    await page.waitForFunction(mode=>document.querySelector('.container')?.dataset.screen==='game'&&document.querySelector('.container')?.dataset.mode===mode,mode);
    const data=await page.evaluate(()=>{
      const issues=[];const vw=innerWidth,vh=innerHeight;
      const rect=e=>e.getBoundingClientRect();
      for(const selector of ['.gameTopBar','.playersPane','.cricketWrap','.padPane']){
        for(const el of document.querySelectorAll(selector)){
          const r=rect(el);if(r.left<-1||r.right>vw+1||r.bottom>vh+2)issues.push({selector,left:r.left,right:r.right,bottom:r.bottom,vw,vh});
        }
      }
      const pad=document.querySelector('.padPane');
      if(pad){const pr=rect(pad);for(const key of pad.querySelectorAll('button')){const r=rect(key);if(r.left<pr.left-2||r.right>pr.right+2||r.bottom>pr.bottom+2)issues.push({key:key.textContent,bounds:true});}}
      const stats=document.querySelector('.roulettePane .playerStats');
      return {
        mode:document.querySelector('.container').dataset.mode,premium:document.querySelector('.container').dataset.premium,
        width:vw,height:vh,players:document.querySelectorAll('.playerCard,.playerCol').length,
        haptics:document.querySelector('.vibrationToggle')?.getAttribute('aria-pressed'),
        numericButtons:document.querySelectorAll('.padPane [data-keypad-number]').length,
        score:document.querySelector('.roulettePane .rouletteScore')?.textContent||null,
        rouletteStats:stats?{size:parseFloat(getComputedStyle(stats).fontSize),direction:getComputedStyle(stats).flexDirection}:null,
        issues
      };
    });
    assert.equal(data.premium,'1');assert.equal(data.players,6);assert.deepEqual(data.issues,[]);
    if(mode==='rouletteDouble'){
      assert.match(data.score,/^Body:\s*\d+/);
      assert.equal(data.rouletteStats.direction,'column');
    }
    adb('shell','screencap','-p','/sdcard/Download/dsp-s23-'+mode+'.png');
    adb('pull','/sdcard/Download/dsp-s23-'+mode+'.png',root+'/'+mode+'-native.png');
    results.push({...data,status:'pass'});
    console.log('PASS',mode,JSON.stringify(data));
    fs.writeFileSync(root+'/basic-results.json',JSON.stringify(results,null,2));
  }
}finally{await browser.close();}

